<?php

namespace App\Http\Controllers\Api\Booking;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Services\BookingRescheduleService;
use App\Services\BookingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GuestBookingRescheduleController extends Controller
{
    public function __construct(
        protected BookingRescheduleService $reschedule,
        protected BookingService $bookings,
    ) {}

    public function quote(Request $request, Booking $booking): JsonResponse
    {
        $this->bookings->assertAccessible($booking, $request->user());

        $validated = $request->validate([
            'check_in' => 'required|date|after_or_equal:today',
            'check_out' => 'required|date|after:check_in',
        ]);

        $payload = $this->reschedule->quote(
            $booking,
            $request->user(),
            $validated['check_in'],
            $validated['check_out']
        );

        return response()->json(['success' => true, 'data' => $payload]);
    }

    public function apply(Request $request, Booking $booking): JsonResponse
    {
        $this->bookings->assertAccessible($booking, $request->user());

        $validated = $request->validate([
            'check_in' => 'required|date|after_or_equal:today',
            'check_out' => 'required|date|after:check_in',
            'reason' => 'nullable|string|max:500',
            'confirm' => 'required|accepted',
        ]);

        $result = $this->reschedule->apply(
            $booking,
            $request->user(),
            $validated['check_in'],
            $validated['check_out'],
            $validated['reason'] ?? null
        );

        return response()->json([
            'success' => true,
            'message' => 'Stay dates updated.',
            'data' => $result,
        ]);
    }
}
