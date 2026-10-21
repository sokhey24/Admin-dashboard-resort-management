<?php

namespace App\Http\Controllers\Api\Activity;

use App\Events\ActivityBookingCreated;
use App\Http\Controllers\Controller;
use App\Http\Requests\Activity\StoreActivityBookingRequest;
use App\Models\ActivityBooking;
use Illuminate\Http\JsonResponse;

class ActivityBookingController extends Controller
{
    public function store(StoreActivityBookingRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $booking = ActivityBooking::create([
            'user_id' => $request->user()?->id,
            'activity_title' => $validated['activity_title'],
            'activity_id' => $validated['activity_id'] ?? null,
            'booking_date' => $validated['booking_date'],
            'guest_count' => $validated['guest_count'],
            'total_price' => $validated['total_price'],
            'guest_name' => $validated['guest_name'],
            'guest_email' => $validated['guest_email'],
            'guest_phone' => $validated['guest_phone'],
            'special_requests' => $validated['special_requests'] ?? null,
            'status' => 'pending',
        ]);

        event(new ActivityBookingCreated($booking->id));

        return response()->json([
            'success' => true,
            'message' => 'Activity booking submitted successfully.',
            'data' => [
                'id' => $booking->id,
                'activity_title' => $booking->activity_title,
                'activity_id' => $booking->activity_id,
                'booking_date' => $booking->booking_date->format('Y-m-d'),
                'guest_count' => $booking->guest_count,
                'total_price' => (float) $booking->total_price,
                'guest_name' => $booking->guest_name,
                'guest_email' => $booking->guest_email,
                'guest_phone' => $booking->guest_phone,
                'special_requests' => $booking->special_requests,
                'status' => $booking->status,
            ],
        ], 201);
    }
}
