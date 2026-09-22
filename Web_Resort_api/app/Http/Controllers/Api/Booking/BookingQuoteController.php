<?php

namespace App\Http\Controllers\Api\Booking;

use App\Http\Controllers\Controller;
use App\Http\Requests\Booking\BookingQuoteRequest;
use App\Models\Room;
use App\Services\BookingService;
use App\Services\CouponService;
use App\Services\PricingService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

/**
 * Authoritative pricing pre-check. The guest site calls this before showing a
 * total and again is re-priced on booking creation, so a tampered quote can
 * never become a booking.
 */
class BookingQuoteController extends Controller
{
    public function __construct(
        protected BookingService $bookings,
        protected PricingService $pricing,
        protected CouponService $coupons,
    ) {}

    public function store(BookingQuoteRequest $request): JsonResponse
    {
        $data = $request->validated();

        $checkIn = Carbon::parse($data['check_in'])->startOfDay();
        $checkOut = Carbon::parse($data['check_out'])->startOfDay();
        $nights = max(1, (int) $checkIn->diffInDays($checkOut));

        $roomIds = array_values(array_unique(array_map('intval', $data['room_ids'])));
        $rooms = Room::with('roomType')->whereIn('id', $roomIds)->get();

        if ($rooms->count() !== count($roomIds)) {
            throw ValidationException::withMessages(['room_ids' => ['One or more rooms were not found.']]);
        }

        if ($rooms->pluck('resort_id')->unique()->count() > 1) {
            throw ValidationException::withMessages(['room_ids' => ['All rooms must belong to the same resort.']]);
        }

        $this->assertOccupancyFits($rooms, (int) ($data['adults'] ?? 1), (int) ($data['children'] ?? 0));

        // Same availability rules the booking itself will enforce.
        $this->bookings->assertRoomsAvailable($roomIds, $checkIn, $checkOut);

        $coupon = null;
        if (! empty($data['coupon_code'])) {
            $netCents = 0;
            foreach ($rooms as $room) {
                $netCents += (int) round(((float) $this->pricing->roomLine($room, $nights)['net_subtotal']) * 100);
            }
            $coupon = $this->coupons->resolve($data['coupon_code'], $netCents);
        }

        $quote = $this->pricing->quoteStay($rooms, $nights, ['coupon' => $coupon]);

        return response()->json([
            'data' => $quote + [
                'resort_id' => (int) $rooms->first()->resort_id,
                'check_in' => $checkIn->toDateString(),
                'check_out' => $checkOut->toDateString(),
                'adults' => (int) ($data['adults'] ?? 1),
                'children' => (int) ($data['children'] ?? 0),
                'currency' => 'USD',
                'tax_rate' => $this->pricing->taxRate(),
                'service_charge_rate' => $this->pricing->serviceChargeRate(),
            ],
        ]);
    }

    protected function assertOccupancyFits($rooms, int $adults, int $children): void
    {
        $capacity = $rooms->sum(fn (Room $room) => (int) ($room->roomType->max_occupancy ?? 0));

        if ($capacity > 0 && ($adults + $children) > $capacity) {
            throw ValidationException::withMessages([
                'adults' => ["The selected room(s) sleep up to {$capacity} guest(s)."],
            ]);
        }
    }
}
