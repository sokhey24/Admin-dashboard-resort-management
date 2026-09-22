<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Guest;
use App\Models\Resort;
use App\Models\Role;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GuestBookingIsolationTest extends TestCase
{
    use RefreshDatabase;

    protected function makeRoom(Resort $resort): Room
    {
        $type = RoomType::create([
            'resort_id' => $resort->id,
            'name' => 'Standard',
            'base_price' => 100,
            'max_occupancy' => 4,
        ]);

        return Room::create([
            'resort_id' => $resort->id,
            'room_type_id' => $type->id,
            'room_number' => 'G-101',
            'price_per_night' => 100,
            'status' => 'available',
        ]);
    }

    protected function customer(string $email): User
    {
        $user = User::create([
            'name' => 'Guest',
            'email' => $email,
            'password' => bcrypt('password123'),
        ]);
        $role = Role::firstOrCreate(['name' => 'customer'], ['display_name' => 'Customer']);
        $user->roles()->attach($role->id);

        return $user;
    }

    public function test_register_assigns_customer_role(): void
    {
        Role::firstOrCreate(['name' => 'customer'], ['display_name' => 'Customer']);

        $response = $this->postJson('/api/auth/register', [
            'name' => 'New Guest',
            'email' => 'newguest@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertCreated();

        $user = User::where('email', 'newguest@example.com')->firstOrFail();
        $this->assertTrue($user->roles()->where('name', 'customer')->exists());
        $this->assertNotEmpty($response->json('access_token'));
        $this->assertDatabaseHas('guests', [
            'user_id' => $user->id,
            'email' => 'newguest@example.com',
            'status' => 'active',
        ]);
    }

    public function test_guest_sees_only_own_bookings(): void
    {
        $resort = Resort::create(['name' => 'A', 'slug' => 'a', 'address' => 'x', 'city' => 'y']);
        $room = $this->makeRoom($resort);

        $alice = $this->customer('alice@example.com');
        $bob = $this->customer('bob@example.com');

        Sanctum::actingAs($alice);
        $aliceBooking = $this->postJson('/api/customer/bookings', [
            'resort_id' => $resort->id,
            'room_ids' => [$room->id],
            'check_in' => '2027-05-01',
            'check_out' => '2027-05-03',
            'adults' => 2,
        ])->assertCreated()->json('data.id');

        Sanctum::actingAs($bob);
        $this->postJson('/api/customer/bookings', [
            'resort_id' => $resort->id,
            'room_ids' => [$room->id],
            'check_in' => '2027-06-01',
            'check_out' => '2027-06-03',
            'adults' => 2,
        ])->assertCreated();

        $list = $this->getJson('/api/customer/bookings')->assertOk()->json('data');
        $this->assertCount(1, $list);
        $this->assertSame($bob->id, (int) $list[0]['user_id']);

        $this->getJson("/api/customer/bookings/{$aliceBooking}")->assertForbidden();
    }

    public function test_website_booking_sets_source(): void
    {
        $resort = Resort::create(['name' => 'B', 'slug' => 'b', 'address' => 'x', 'city' => 'y']);
        $room = $this->makeRoom($resort);
        $guest = $this->customer('web@example.com');

        Sanctum::actingAs($guest);
        $id = $this->postJson('/api/customer/bookings', [
            'resort_id' => $resort->id,
            'room_ids' => [$room->id],
            'check_in' => '2027-07-01',
            'check_out' => '2027-07-03',
            'adults' => 2,
            'source' => 'staff',
        ])->assertCreated()->json('data.id');

        $booking = Booking::findOrFail($id);
        $this->assertSame('website', $booking->source);
        $this->assertNotNull($booking->guest_id);
        $profile = Guest::find($booking->guest_id);
        $this->assertSame($guest->id, (int) $profile?->user_id);
    }
}
