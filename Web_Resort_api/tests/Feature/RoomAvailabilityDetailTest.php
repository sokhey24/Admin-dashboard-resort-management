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

class RoomAvailabilityDetailTest extends TestCase
{

    protected Room $room;

    protected User $user;

    protected BookingService $bookings;

    protected function setUp(): void
    {
        parent::setUp();

        $this->bookings = app(BookingService::class);

        $this->user = User::create([
            'name' => 'Guest',
            'email' => 'guest-detail@example.com',
            'password' => bcrypt('secret'),
        ]);

        $resort = Resort::create([
            'name' => 'Test Resort',
            'slug' => 'test-resort-detail',
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
            'room_number' => 'KH-003',
            'price_per_night' => 100,
            'status' => 'available',
        ]);
    }

    protected function attachBooking(string $checkIn, string $checkOut, string $status = 'confirmed'): void
    {
        $in = Carbon::parse($checkIn)->startOfDay();
        $out = Carbon::parse($checkOut)->startOfDay();
        $booking = new Booking([
            'resort_id' => $this->room->resort_id,
            'booking_code' => 'BK-DET-'.uniqid(),
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
    }

    public function test_next_available_after_single_conflict(): void
    {
        $this->attachBooking('2026-10-08', '2026-10-11');
        $windows = $this->bookings->blockingStayWindowsForRoom($this->room->id);
        $next = $this->bookings->nextAvailableCheckInForStayLength(
            $windows,
            Carbon::parse('2026-10-08'),
            4
        );
        $this->assertSame('2026-10-11', $next);
    }

    public function test_back_to_back_bookings_push_next_available(): void
    {
        $this->attachBooking('2026-10-08', '2026-10-11');
        $this->attachBooking('2026-10-11', '2026-10-15');
        $windows = $this->bookings->blockingStayWindowsForRoom($this->room->id);
        $next = $this->bookings->nextAvailableCheckInForStayLength(
            $windows,
            Carbon::parse('2026-10-08'),
            4
        );
        $this->assertSame('2026-10-15', $next);
    }

    public function test_gap_does_not_fit_requested_stay_length(): void
    {
        $this->attachBooking('2026-10-08', '2026-10-10');
        $this->attachBooking('2026-10-12', '2026-10-15');
        $windows = $this->bookings->blockingStayWindowsForRoom($this->room->id);
        $next = $this->bookings->nextAvailableCheckInForStayLength(
            $windows,
            Carbon::parse('2026-10-08'),
            5
        );
        $this->assertSame('2026-10-15', $next);
    }

    public function test_payload_lists_conflicts_without_guest_fields(): void
    {
        $this->attachBooking('2026-10-08', '2026-10-11');
        $checkIn = Carbon::parse('2026-10-08');
        $checkOut = Carbon::parse('2026-10-12');
        $payload = $this->bookings->buildUnavailableRoomsPayload(
            [$this->room->id],
            $checkIn,
            $checkOut
        );

        $this->assertCount(1, $payload);
        $row = $payload[0];
        $this->assertSame('KH-003', $row['room_number']);
        $this->assertSame('2026-10-11', $row['next_available_from']);
        $this->assertCount(1, $row['conflicts']);
        $this->assertSame(
            ['check_in' => '2026-10-08', 'check_out' => '2026-10-11'],
            $row['conflicts'][0]
        );
        $encoded = json_encode($row);
        $this->assertStringNotContainsString('user_id', $encoded);
        $this->assertStringNotContainsString('booking_id', $encoded);
        $this->assertStringNotContainsString('email', $encoded);
    }
}
