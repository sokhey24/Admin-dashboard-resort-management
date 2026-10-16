<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Resort;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\User;
use App\Services\BookingService;
use Carbon\Carbon;
use Tests\TestCase;

class BookingAvailabilityTest extends TestCase
{

    protected Room $room;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::create([
            'name' => 'Guest',
            'email' => 'guest-avail@example.com',
            'password' => bcrypt('secret'),
        ]);

        $resort = Resort::create([
            'name' => 'Test Resort',
            'slug' => 'test-resort',
            'address' => 'Street',
            'city' => 'City',
        ]);

        $type = RoomType::create([
            'resort_id' => $resort->id,
            'name' => 'Standard',
            'base_price' => 100,
            'max_occupancy' => 2,
        ]);

        $this->room = Room::create([
            'resort_id' => $resort->id,
            'room_type_id' => $type->id,
            'room_number' => '0005',
            'price_per_night' => 100,
            'status' => 'occupied',
        ]);
    }

    protected function attachBooking(string $checkIn, string $checkOut, string $status): Booking
    {
        $in = Carbon::parse($checkIn)->startOfDay();
        $out = Carbon::parse($checkOut)->startOfDay();
        $booking = new Booking([
            'resort_id' => $this->room->resort_id,
            'booking_code' => 'BK-TEST-'.uniqid(),
            'check_in' => $in,
            'check_out' => $out,
            'nights' => max(1, (int) $in->diffInDays($out)),
            'status' => $status,
            'adults' => 2,
            'subtotal' => 100,
            'total_amount' => 100,
            'balance_due' => 100,
        ]);
        $booking->user_id = $this->user->id;
        $booking->save();
        $booking->rooms()->attach($this->room->id, [
            'price_per_night' => 100,
            'nights' => $booking->nights,
            'discount_percent' => 0,
            'discount_amount' => 0,
            'subtotal' => 100,
            'net_subtotal' => 100,
        ]);

        return $booking;
    }

    protected function overlaps(string $requestedIn, string $requestedOut): bool
    {
        $svc = app(BookingService::class);
        $ci = Carbon::parse($requestedIn)->startOfDay();
        $co = Carbon::parse($requestedOut)->startOfDay();

        return $svc->overlappingRoomIds([$this->room->id], $ci, $co) !== [];
    }

    public function test_overlap_blocks_mid_stay(): void
    {
        $this->attachBooking('2026-09-20', '2026-09-25', 'confirmed');
        $this->assertTrue($this->overlaps('2026-09-22', '2026-09-24'));
    }

    public function test_checkout_day_allows_next_check_in(): void
    {
        $this->attachBooking('2026-09-20', '2026-09-25', 'confirmed');
        $this->assertFalse($this->overlaps('2026-09-25', '2026-09-28'));
    }

    public function test_completed_booking_does_not_block_future_stay(): void
    {
        $this->attachBooking('2026-09-20', '2026-09-25', 'completed');
        $this->assertFalse($this->overlaps('2026-09-26', '2026-09-28'));
    }

    public function test_partial_overlap_before_checkout_is_blocked(): void
    {
        $this->attachBooking('2026-09-20', '2026-09-25', 'confirmed');
        $this->assertTrue($this->overlaps('2026-09-24', '2026-09-28'));
    }

    public function test_stay_before_existing_booking_is_available(): void
    {
        $this->attachBooking('2026-09-20', '2026-09-25', 'confirmed');
        $this->assertFalse($this->overlaps('2026-09-15', '2026-09-20'));
    }

    public function test_cancelled_booking_does_not_block(): void
    {
        $this->attachBooking('2026-09-20', '2026-09-25', 'cancelled');
        $this->assertFalse($this->overlaps('2026-09-22', '2026-09-24'));
    }

    public function test_future_confirmed_booking_blocks_overlap(): void
    {
        $this->attachBooking('2026-09-25', '2026-09-30', 'confirmed');
        $this->assertTrue($this->overlaps('2026-09-27', '2026-09-29'));
    }

    public function test_long_overlap_is_blocked(): void
    {
        $this->attachBooking('2026-09-20', '2026-09-25', 'confirmed');
        $this->assertTrue($this->overlaps('2026-09-18', '2026-09-28'));
    }
}
