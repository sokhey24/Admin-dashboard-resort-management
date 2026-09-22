<?php

namespace App\Http\Controllers\Api\Booking;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Services\BookingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BookingStatusController extends Controller
{
    public function __construct(protected BookingService $service) {}

    public function index(Request $request, Booking $booking): JsonResponse
    {
        $this->service->assertAccessible($booking, $request->user());

        return response()->json($booking->statusLogs()->latest()->get());
    }

    public function update(Request $request, Booking $booking): JsonResponse
    {
        $this->service->assertAccessible($booking, $request->user());
        $request->validate([
            'status' => 'required|in:pending,confirmed,checked_in,checked_out,cancelled,completed',
            'cancellation_reason' => 'nullable|string|max:500',
        ]);

        $booking = $this->service->transitionStatus(
            $booking,
            $request->status,
            $request->user(),
            $request->cancellation_reason
        );

        return response()->json(['data' => $booking->load(['user', 'rooms.roomType', 'resort', 'payment', 'payments', 'invoice'])]);
    }
}
