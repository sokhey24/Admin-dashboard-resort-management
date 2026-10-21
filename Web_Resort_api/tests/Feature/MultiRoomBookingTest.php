<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Branch;
use App\Models\Resort;
use App\Models\Role;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\User;
use App\Services\BookingService;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MultiRoomBookingTest extends TestCase
{
    protected function guest(): User
    {
        $user = User::create([
            'name' => 'Multi Guest',
            'email' => 'multi-'.uniqid().'@example.com',
            'password' => bcrypt('password'),
        ]);
        $role = Role::firstOrCreate(['name' => 'customer'], ['display_name' => 'Customer']);
        $user->roles()->attach($role->id);

        return $user;
    }

    protected function setupResort(): array
    {
        $resort = Resort::create(['name' => 'MR', 'slug' => 'mr-'.uniqid(), 'address' => 'a', 'city' => 'c']);
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
        $rooms = [];
        foreach (['M1', 'M2'] as $num) {
            $rooms[] = Room::create([
                'resort_id' => $resort->id,
                'branch_id' => $branch->id,
                'room_type_id' => $type->id,
                'room_number' => $num,
                'price_per_night' => 100,
                'status' => 'available',
            ]);
        }

        return [$resort, $branch, $rooms];
    }

    public function test_quote_sums_multiple_rooms(): void
    {
        [$resort, $branch, $rooms] = $this->setupResort();
        $user = $this->guest();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/customer/booking/quote', [
            'room_ids' => [$rooms[0]->id, $rooms[1]->id],
            'branch_id' => $branch->id,
            'check_in' => '2028-04-01',
            'check_out' => '2028-04-03',
            'adults' => 2,
        ])->assertOk();

        $total = (float) $response->json('data.total');
        $this->assertGreaterThan(350, $total);
        $this->assertCount(2, $response->json('data.rooms'));
    }

    public function test_create_booking_attaches_all_rooms(): void
    {
        [$resort, $branch, $rooms] = $this->setupResort();
        $user = $this->guest();
        Sanctum::actingAs($user);

        $id = $this->postJson('/api/customer/bookings', [
            'resort_id' => $resort->id,
            'branch_id' => $branch->id,
            'room_ids' => [$rooms[0]->id, $rooms[1]->id],
            'check_in' => '2028-05-01',
            'check_out' => '2028-05-03',
            'adults' => 3,
        ])->assertCreated()->json('data.id');

        $booking = Booking::with('rooms')->findOrFail($id);
        $this->assertCount(2, $booking->rooms);
    }

    public function test_second_booking_blocks_overlapping_room(): void
    {
        [$resort, $branch, $rooms] = $this->setupResort();
        $user = $this->guest();

        app(BookingService::class)->createBooking([
            'resort_id' => $resort->id,
            'branch_id' => $branch->id,
            'room_ids' => [$rooms[0]->id],
            'check_in' => '2028-06-01',
            'check_out' => '2028-06-05',
            'adults' => 2,
            'user_id' => $user->id,
        ], $user);

        Sanctum::actingAs($user);

        $this->postJson('/api/customer/bookings', [
            'resort_id' => $resort->id,
            'branch_id' => $branch->id,
            'room_ids' => [$rooms[0]->id],
            'check_in' => '2028-06-02',
            'check_out' => '2028-06-04',
            'adults' => 2,
        ])->assertStatus(422);
    }

    public function test_single_room_booking_still_works(): void
    {
        [$resort, $branch, $rooms] = $this->setupResort();
        $user = $this->guest();
        Sanctum::actingAs($user);

        $this->postJson('/api/customer/bookings', [
            'resort_id' => $resort->id,
            'branch_id' => $branch->id,
            'room_ids' => [$rooms[0]->id],
            'check_in' => '2028-07-01',
            'check_out' => '2028-07-02',
            'adults' => 2,
        ])->assertCreated();
    }
}
