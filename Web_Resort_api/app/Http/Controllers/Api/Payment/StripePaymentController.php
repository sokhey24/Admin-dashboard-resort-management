<?php

namespace App\Http\Controllers\Api\Payment;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Payment;
use App\Services\BookingService;
use App\Services\StripePaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StripePaymentController extends Controller
{
    public function __construct(
        protected StripePaymentService $stripe,
        protected BookingService $bookings,
    ) {}

    public function storeIntent(Request $request, Booking $booking): JsonResponse
    {
        $this->bookings->assertAccessible($booking, $request->user());

        $validated = $request->validate([
            'client_request_id' => 'nullable|string|max:128',
        ]);

        $payload = $this->stripe->createPaymentIntent(
            $booking,
            $request->user(),
            $validated['client_request_id'] ?? null
        );

        return response()->json(['data' => $payload], 201);
    }

    public function sync(Request $request, Payment $payment): JsonResponse
    {
        $result = $this->stripe->syncPaymentIntent($payment, $request->user());

        return response()->json([
            'status' => $result['status'],
            'paid' => $result['paid'],
            'message' => $result['message'],
            'data' => $result['payment'] ?? null,
        ]);
    }
}
