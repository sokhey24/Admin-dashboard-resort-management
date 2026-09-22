<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use KHQR\BakongKHQR;
use KHQR\Exceptions\KHQRException;
use KHQR\Helpers\KHQRData;
use KHQR\Models\IndividualInfo;

class PaymentController extends Controller
{
    /**
     * Generate a KHQR for a product and persist it as a pending payment.
     */
    public function checkout(Product $product)
    {
        // The amount always comes from the database, never from the request.
        $amount = round((float) $product->price, 2);

        if ($amount <= 0) {
            return back()->withErrors(['payment' => 'This product has no payable price.']);
        }

        try {
            $response = BakongKHQR::generateIndividual(new IndividualInfo(
                bakongAccountID: (string) config('services.bakong.account_id'),
                merchantName: (string) config('services.bakong.merchant_name'),
                merchantCity: (string) config('services.bakong.merchant_city'),
                currency: $this->currencyCode(),
                amount: $amount,
            ));
        } catch (KHQRException|\Throwable $e) {
            Log::error('KHQR generation failed', ['product' => $product->id, 'error' => $e->getMessage()]);

            return back()->withErrors(['payment' => 'Could not generate the payment QR. Please try again.']);
        }

        // The SDK reports success as status.code === 0 and carries the payload in data.
        $qr = $response->data['qr'] ?? null;
        $md5 = $response->data['md5'] ?? null;

        if (($response->status['code'] ?? 1) !== 0 || ! is_string($qr) || $qr === '' || ! is_string($md5)) {
            Log::error('KHQR response invalid', ['product' => $product->id, 'status' => $response->status]);

            return back()->withErrors(['payment' => 'The payment QR returned by Bakong was invalid.']);
        }

        $payment = Payment::create([
            'product_id' => $product->id,
            'md5' => $md5,
            'qr_payload' => $qr,
            'amount' => $amount,
            'currency' => $this->currencyName(),
            'status' => Payment::STATUS_PENDING,
            'expires_at' => now()->addSeconds((int) config('services.bakong.qr_ttl_seconds')),
        ]);

        return view('products.checkout', [
            'product' => $product,
            'payment' => $payment,
            'qr' => $qr,
        ]);
    }

    /**
     * Poll Bakong for a payment. Called by the checkout page only.
     */
    public function verifyTransaction(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'md5' => ['required', 'string', 'regex:/^[a-f0-9]{32}$/i'],
        ]);

        $payment = Payment::where('md5', $validated['md5'])->first();

        if (! $payment) {
            return $this->state('invalid', 'This payment reference is not recognised.', 404);
        }

        // Already settled: answer from our own records, never re-credit.
        if ($payment->isPaid()) {
            return $this->state('paid', 'Payment already confirmed.', 200, $payment);
        }

        if ($payment->isExpired()) {
            $payment->update(['status' => Payment::STATUS_EXPIRED]);

            return $this->state('expired', 'This QR has expired. Please start again.', 200, $payment);
        }

        try {
            $result = (new BakongKHQR((string) config('services.bakong.token')))
                ->checkTransactionByMD5($payment->md5, (bool) config('services.bakong.use_sandbox'));
        } catch (KHQRException|\Throwable $e) {
            Log::warning('Bakong verification call failed', ['md5' => $payment->md5, 'error' => $e->getMessage()]);

            return $this->state('api_error', 'Could not reach Bakong. Please try again shortly.', 502, $payment);
        }

        $code = $result['responseCode'] ?? null;
        $data = $result['data'] ?? null;

        // Bakong answers HTTP 200 with responseCode 1 while the QR is unpaid,
        // so only responseCode 0 *with* a transaction body means settled.
        if ($code !== 0 || ! is_array($data)) {
            return $this->state('pending', 'Waiting for payment.', 200, $payment);
        }

        if (! $this->transactionMatches($payment, $data)) {
            Log::error('Bakong amount/currency mismatch', [
                'md5' => $payment->md5,
                'expected' => [$payment->amount, $payment->currency],
                'received' => [$data['amount'] ?? null, $data['currency'] ?? null],
            ]);
            $payment->update(['status' => Payment::STATUS_MISMATCHED]);

            return $this->state('failed', 'The paid amount did not match this order.', 409, $payment);
        }

        $payment = $this->confirm($payment, $data);

        return $this->state('paid', 'Payment confirmed.', 200, $payment);
    }

    public function paymentResult(Request $request)
    {
        $payment = Payment::where('md5', (string) $request->query('ref'))->first();

        return view('payments.result', ['payment' => $payment]);
    }

    /**
     * Mark the payment settled under a row lock so concurrent pollers
     * cannot confirm the same payment twice.
     */
    private function confirm(Payment $payment, array $data): Payment
    {
        return DB::transaction(function () use ($payment, $data) {
            $locked = Payment::whereKey($payment->getKey())->lockForUpdate()->first();

            if ($locked->isPaid()) {
                return $locked;
            }

            $locked->update([
                'status' => Payment::STATUS_PAID,
                'bakong_hash' => $data['hash'] ?? null,
                'paid_at' => now(),
            ]);

            return $locked;
        });
    }

    private function transactionMatches(Payment $payment, array $data): bool
    {
        if (! isset($data['amount'], $data['currency']) || ! is_numeric($data['amount'])) {
            return false;
        }

        if (strtoupper((string) $data['currency']) !== strtoupper($payment->currency)) {
            return false;
        }

        // Compare in minor units so float representation never decides a payment.
        $paid = (int) floor(((float) $data['amount']) * 100);
        $expected = (int) round(((float) $payment->amount) * 100);

        return $paid === $expected;
    }

    private function state(string $status, string $message, int $httpCode, ?Payment $payment = null): JsonResponse
    {
        return response()->json([
            'status' => $status,
            'message' => $message,
            'paid' => $status === 'paid',
            'redirect' => $status === 'paid' && $payment
                ? route('payments.result', ['ref' => $payment->md5])
                : null,
        ], $httpCode);
    }

    private function currencyName(): string
    {
        return strtoupper((string) config('services.bakong.currency')) === 'KHR' ? 'KHR' : 'USD';
    }

    private function currencyCode(): int
    {
        return $this->currencyName() === 'KHR'
            ? KHQRData::CURRENCY_KHR
            : KHQRData::CURRENCY_USD;
    }
}
