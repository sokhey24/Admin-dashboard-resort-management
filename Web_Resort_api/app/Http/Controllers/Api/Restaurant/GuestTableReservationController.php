<?php

namespace App\Http\Controllers\Api\Restaurant;

use App\Events\TableReservationRequested;
use App\Http\Controllers\Controller;
use App\Http\Requests\Restaurant\StoreGuestTableReservationRequest;
use App\Models\TableReservation;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class GuestTableReservationController extends Controller
{
    public function store(StoreGuestTableReservationRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $reservedAt = Carbon::parse(
            $validated['reservation_date'].' '.$validated['reservation_time']
        );

        $reservation = TableReservation::create([
            'user_id' => $request->user()?->id,
            'restaurant_table_id' => null,
            'reserved_at' => $reservedAt,
            'guests' => $validated['guest_count'],
            'guest_name' => $validated['guest_name'],
            'guest_email' => $validated['guest_email'],
            'guest_phone' => $validated['guest_phone'],
            'note' => $validated['note'] ?? null,
            'status' => 'pending',
        ]);

        event(new TableReservationRequested($reservation->id));

        return response()->json([
            'success' => true,
            'message' => 'Table reservation request submitted successfully.',
            'data' => [
                'id' => $reservation->id,
                'reserved_at' => $reservation->reserved_at?->toIso8601String(),
                'guest_count' => (int) $reservation->guests,
                'guest_name' => $reservation->guest_name,
                'guest_email' => $reservation->guest_email,
                'guest_phone' => $reservation->guest_phone,
                'note' => $reservation->note,
                'status' => $reservation->status,
            ],
        ], 201);
    }
}
