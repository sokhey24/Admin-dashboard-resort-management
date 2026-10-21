<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\Booking;
use App\Models\BookingDateChange;
use App\Models\Branch;
use App\Models\Resort;
use App\Models\Role;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\User;
use App\Services\BookingService;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BookingRescheduleTest extends TestCase
{
    protected function guest(): User
    {
        $user = User::create([
            'name' => 'Reschedule Guest',
            'email' => 'rs-'.uniqid().'@example.com',
            'password' => bcrypt('password'),
        ]);
        $role = Role::firstOrCreate(['name' => 'customer'], ['display_name' => 'Customer']);
        $user->roles()->attach($role->id);

        return $user;
    }

    protected function confirmedBooking(User $user): Booking
    {
        $resort = Resort::create(['name' => 'R', 'slug' => 'r-'.uniqid(), 'address' => 'a', 'city' => 'c']);
        $branch = Branch::create([
            'resort_id' => $resort->id,
            'name' => 'Main',
            'address' => 'a',
            'status' => 'active',
            'is_active' => true,
        ]);
        $type = RoomType::create([
            'resort_id' => $resort->id,
            'branch_id' => $branch->id,
            'name' => 'Std',
            'base_price' => 100,
            'max_occupancy' => 4,
        ]);
        $room = Room::create([
            'resort_id' => $resort->id,
            'branch_id' => $branch->id,
            'room_type_id' => $type->id,
            'room_number' => 'R1',
            'price_per_night' => 100,
            'status' => 'available',
        ]);

        $booking = app(BookingService::class)->createBooking([
            'resort_id' => $resort->id,
            'branch_id' => $branch->id,
            'room_ids' => [$room->id],
            'check_in' => now()->addDays(14)->format('Y-m-d'),
            'check_out' => now()->addDays(16)->format('Y-m-d'),
            'adults' => 2,
            'user_id' => $user->id,
            'status' => 'pending',
        ], $user);

        $booking->update(['status' => 'confirmed']);

        return $booking->fresh();
    }

    public function test_guest_can_quote_reschedule(): void
    {
        $user = $this->guest();
        $booking = $this->confirmedBooking($user);
        Sanctum::actingAs($user);

        $newIn = now()->addDays(20)->format('Y-m-d');
        $newOut = now()->addDays(22)->format('Y-m-d');

        $this->postJson("/api/customer/bookings/{$booking->id}/reschedule/quote", [
            'check_in' => $newIn,
            'check_out' => $newOut,
        ])->assertOk()->assertJsonPath('data.proposed.check_in', $newIn);
    }

    public function test_other_guest_cannot_reschedule(): void
    {
        $owner = $this->guest();
        $intruder = $this->guest();
        $booking = $this->confirmedBooking($owner);
        Sanctum::actingAs($intruder);

        $this->postJson("/api/customer/bookings/{$booking->id}/reschedule/quote", [
            'check_in' => now()->addDays(25)->format('Y-m-d'),
            'check_out' => now()->addDays(27)->format('Y-m-d'),
        ])->assertForbidden();
    }

    public function test_apply_updates_dates_and_logs_history(): void
    {
        $user = $this->guest();
        $booking = $this->confirmedBooking($user);
        Sanctum::actingAs($user);

        $newIn = now()->addDays(30)->format('Y-m-d');
        $newOut = now()->addDays(33)->format('Y-m-d');

        $this->postJson("/api/customer/bookings/{$booking->id}/reschedule", [
            'check_in' => $newIn,
            'check_out' => $newOut,
            'confirm' => true,
            'reason' => 'Change of plans',
        ])->assertOk();

        $booking->refresh();
        $this->assertSame($newIn, $booking->check_in->format('Y-m-d'));
        $this->assertSame(1, BookingDateChange::where('booking_id', $booking->id)->count());
        $this->assertTrue(
            ActivityLog::query()->where('action', 'booking.rescheduled')->where('model_id', $booking->id)->exists()
        );
    }

    public function test_reschedule_rejects_unavailable_dates(): void
    {
        $user = $this->guest();
        $booking = $this->confirmedBooking($user);
        $roomId = (int) $booking->rooms()->first()->id;

        $blocker = app(BookingService::class)->createBooking([
            'resort_id' => $booking->resort_id,
            'branch_id' => $booking->branch_id,
            'room_ids' => [$roomId],
            'check_in' => now()->addDays(40)->format('Y-m-d'),
            'check_out' => now()->addDays(42)->format('Y-m-d'),
            'adults' => 2,
            'user_id' => $this->guest()->id,
        ], $user);

        Sanctum::actingAs($user);

        $this->postJson("/api/customer/bookings/{$booking->id}/reschedule/quote", [
            'check_in' => $blocker->check_in->format('Y-m-d'),
            'check_out' => $blocker->check_out->format('Y-m-d'),
        ])->assertStatus(422);
    }
}
