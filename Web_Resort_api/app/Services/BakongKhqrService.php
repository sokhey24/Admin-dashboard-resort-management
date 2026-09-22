<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use KHQR\BakongKHQR;
use KHQR\Exceptions\KHQRException;
use KHQR\Helpers\EMV;
use KHQR\Helpers\KHQRData;
use KHQR\Models\IndividualInfo;

/**
 * Bakong KHQR generation and verification (ported from Payment_process/bakong-ecom).
 */
class BakongKhqrService
{
    /**
     * @return array{qr: string, md5: string}
     */
    public function generate(float $amount): array
    {
        $amount = round($amount, 2);
        if ($amount <= 0) {
            throw ValidationException::withMessages(['amount' => ['Payment amount must be greater than zero.']]);
        }

        $accountId = trim((string) config('services.bakong.account_id'));
        $merchantName = $this->truncateUtf8(trim((string) config('services.bakong.merchant_name')), EMV::INVALID_LENGTH_MERCHANT_NAME);
        $merchantCity = $this->truncateUtf8(trim((string) config('services.bakong.merchant_city')), EMV::INVALID_LENGTH_MERCHANT_CITY);

        try {
            $response = BakongKHQR::generateIndividual(new IndividualInfo(
                bakongAccountID: $accountId,
                merchantName: $merchantName,
                merchantCity: $merchantCity,
                currency: $this->currencyCode(),
                amount: $amount,
            ));
        } catch (KHQRException|\Throwable $e) {
            Log::error('KHQR generation failed', ['error' => $e->getMessage()]);
            throw ValidationException::withMessages(['payment' => ['Could not generate the payment QR. Please try again.']]);
        }

        $qr = $response->data['qr'] ?? null;
        $md5 = $response->data['md5'] ?? null;

        if (($response->status['code'] ?? 1) !== 0 || ! is_string($qr) || $qr === '' || ! is_string($md5)) {
            Log::error('KHQR response invalid', ['status' => $response->status ?? null]);
            throw ValidationException::withMessages(['payment' => ['The payment QR returned by Bakong was invalid.']]);
        }

        $crc = BakongKHQR::verify($qr);
        if (! $crc->isValid) {
            Log::error('KHQR CRC validation failed', ['md5' => $md5]);
            throw ValidationException::withMessages(['payment' => ['The payment QR failed format checks. Check Bakong merchant settings.']]);
        }

        return ['qr' => $qr, 'md5' => strtolower($md5)];
    }

    /**
     * @return array{state: string, message: string, data?: array}
     */
    public function checkByMd5(string $md5): array
    {
        $md5 = strtolower($md5);

        try {
            $result = (new BakongKHQR((string) config('services.bakong.token')))
                ->checkTransactionByMD5($md5, (bool) config('services.bakong.use_sandbox'));
        } catch (KHQRException|\Throwable $e) {
            Log::warning('Bakong verification call failed', ['md5' => $md5, 'error' => $e->getMessage()]);

            return ['state' => 'api_error', 'message' => 'Could not reach Bakong. Please try again shortly.'];
        }

        $code = $result['responseCode'] ?? null;
        $data = $result['data'] ?? null;

        if ($code !== 0 || ! is_array($data)) {
            return ['state' => 'pending', 'message' => 'Waiting for payment.'];
        }

        return ['state' => 'paid', 'message' => 'Payment confirmed.', 'data' => $data];
    }

    public function transactionMatches(float $expectedAmount, string $expectedCurrency, array $data): bool
    {
        if (! isset($data['amount'], $data['currency']) || ! is_numeric($data['amount'])) {
            return false;
        }

        if (strtoupper((string) $data['currency']) !== strtoupper($expectedCurrency)) {
            return false;
        }

        $paid = (int) floor(((float) $data['amount']) * 100);
        $expected = (int) round($expectedAmount * 100);

        return $paid === $expected;
    }

    protected function currencyName(): string
    {
        return strtoupper((string) config('services.bakong.currency', 'USD')) === 'KHR' ? 'KHR' : 'USD';
    }

    protected function currencyCode(): int
    {
        return $this->currencyName() === 'KHR'
            ? KHQRData::CURRENCY_KHR
            : KHQRData::CURRENCY_USD;
    }

    protected function truncateUtf8(string $value, int $maxChars): string
    {
        if ($value === '') {
            return $value;
        }

        return mb_strlen($value, 'UTF-8') > $maxChars
            ? mb_substr($value, 0, $maxChars, 'UTF-8')
            : $value;
    }
}
