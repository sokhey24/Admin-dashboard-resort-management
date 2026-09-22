<?php

namespace App\Http\Controllers\Api\Booking;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\BookingRoom;
use App\Services\BookingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BookingRoomController extends Controller
{
    public function __construct(protected BookingService $bookings) {}

    public function index(Request $request, int $bookingId): JsonResponse
    {
        return response()->json(BookingRoom::where('booking_id', $bookingId)->with('room')->get());
    }

    public function show(Request $request, BookingRoom $bookingRoom): JsonResponse
    {
        return response()->json(['data' => $bookingRoom->load('room.roomType')]);
    }

    /**
     * Attach a room to a booking. Only the selection is accepted — the rate,
     * discount and subtotal are derived from the catalogue and the booking's
     * own dates, and the booking totals are recalculated.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'booking_id' => ['required', 'integer', 'exists:bookings,id'],
            'room_id' => ['required', 'integer', 'exists:rooms,id'],
        ]);

        $booking = Booking::findOrFail($data['booking_id']);
        $this->bookings->assertAccessible($booking, $request->user());

        $roomIds = $booking->rooms()->pluck('rooms.id')
            ->push((int) $data['room_id'])
            ->unique()->values()->all();

        $booking = $this->bookings->updateBooking($booking, ['room_ids' => $roomIds], $request->user());

        return response()->json(['data' => $booking->load('rooms.roomType')], 201);
    }

    public function update(): JsonResponse
    {
        return response()->json([
            'errors' => ['message' => 'Room rates and discounts are derived from the catalogue and cannot be edited directly.'],
        ], 422);
    }

    public function destroy(Request $request, BookingRoom $bookingRoom): JsonResponse
    {
        $booking = Booking::findOrFail($bookingRoom->booking_id);
        $this->bookings->assertAccessible($booking, $request->user());

        $roomIds = $booking->rooms()->pluck('rooms.id')
            ->reject(fn ($id) => (int) $id === (int) $bookingRoom->room_id)
            ->values()->all();

        if ($roomIds === []) {
            return response()->json([
                'errors' => ['message' => 'A booking must keep at least one room. Cancel the booking instead.'],
            ], 422);
        }

        $booking = $this->bookings->updateBooking($booking, ['room_ids' => $roomIds], $request->user());

        return response()->json(['data' => $booking->load('rooms.roomType')]);
    }
}
