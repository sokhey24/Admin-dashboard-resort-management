<?php

namespace App\Http\Controllers\Api\Payment;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Payment;
use App\Services\BookingService;
use App\Services\KhqrQrImageService;
use App\Services\PaymentReceiptService;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KhqrPaymentController extends Controller
{
    public function __construct(
        protected PaymentService $payments,
        protected BookingService $bookings,
        protected PaymentReceiptService $receipts,
        protected KhqrQrImageService $khqrImages,
    ) {}

    public function store(Request $request, Booking $booking): JsonResponse
    {
        $this->bookings->assertAccessible($booking, $request->user());

        $validated = $request->validate([
            'gateway' => 'nullable|in:aba-khqr,acleda-khqr',
        ]);

        $payment = $this->payments->initiateKhqr(
            $booking,
            $request->user(),
            $validated['gateway'] ?? 'aba-khqr'
        );

        $seconds = $payment->expires_at
            ? max(0, (int) $payment->expires_at->diffInSeconds(now()))
            : (int) config('services.bakong.qr_ttl_seconds', 300);

        $qrPayload = (string) $payment->qr_payload;
        $qrSvg = $qrPayload !== '' ? $this->khqrImages->svg($qrPayload) : '';

        return response()->json([
            'data' => [
                'payment_id' => $payment->payment_id,
                'id' => $payment->id,
                'amount' => (float) $payment->amount,
                'currency' => $payment->currency,
                'status' => $payment->status,
                'khqr_md5' => $payment->khqr_md5,
                'qr_payload' => $qrPayload,
                'qr_svg' => $qrSvg,
                'expires_at' => $payment->expires_at?->toIso8601String(),
                'seconds_remaining' => $seconds,
                'booking_id' => $payment->booking_id,
            ],
        ], 201);
    }

    /** Same contract as Payment_process/bakong-ecom verify (md5 poll). */
    public function verifyByMd5(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'md5' => ['required', 'string', 'regex:/^[a-f0-9]{32}$/i'],
        ]);

        $payment = Payment::where('khqr_md5', strtolower($validated['md5']))->first();
        if (! $payment) {
            return response()->json([
                'status' => 'invalid',
                'message' => 'This payment reference is not recognised.',
                'paid' => false,
            ], 404);
        }

        return $this->verifyResponse($payment, $request);
    }

    public function verify(Request $request, Payment $payment): JsonResponse
    {
        return $this->verifyResponse($payment, $request);
    }

    protected function verifyResponse(Payment $payment, Request $request): JsonResponse
    {
        $result = $this->payments->verifyKhqr($payment, $request->user());

        $payload = [
            'status' => $result['status'],
            'message' => $result['message'],
            'paid' => $result['paid'],
            'redirect' => null,
        ];

        if (! empty($result['payment'])) {
            $payload['data'] = $this->receipts->buildReceiptData($result['payment']);
        }

        $http = match ($result['status']) {
            'failed' => 409,
            'invalid' => 404,
            'api_error' => 502,
            default => 200,
        };

        return response()->json($payload, $http);
    }
}
