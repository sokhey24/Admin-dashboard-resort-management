<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Resort;
use App\Models\Review;
use App\Models\Role;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\User;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CustomerGuestReviewTest extends TestCase
{

    protected function customer(string $email = 'guest@example.com'): User
    {
        $user = User::create([
            'name' => 'Guest User',
            'email' => $email,
            'password' => bcrypt('password123'),
        ]);
        $role = Role::firstOrCreate(['name' => 'customer'], ['display_name' => 'Customer']);
        $user->roles()->attach($role->id);

        return $user;
    }

    protected function resortWithRoom(): array
    {
        $resort = Resort::create([
            'name' => 'Solara Test',
            'slug' => 'solara-test',
            'address' => '1 Test St',
            'city' => 'Phnom Penh',
        ]);

        $type = RoomType::create([
            'resort_id' => $resort->id,
            'name' => 'Ocean Villa',
            'base_price' => 200,
            'max_occupancy' => 4,
        ]);

        $room = Room::create([
            'resort_id' => $resort->id,
            'room_type_id' => $type->id,
            'room_number' => 'KH-003',
            'price_per_night' => 200,
            'status' => 'available',
        ]);

        return [$resort, $room];
    }

    protected function completedBooking(User $user, Resort $resort, Room $room): Booking
    {
        $booking = Booking::create([
            'user_id' => $user->id,
            'resort_id' => $resort->id,
            'booking_code' => 'BK-TEST-'.uniqid(),
            'check_in' => now()->subDays(5),
            'check_out' => now()->subDays(2),
            'nights' => 3,
            'adults' => 2,
            'subtotal' => 600,
            'total_amount' => 600,
            'balance_due' => 0,
            'status' => 'completed',
            'completed_at' => now()->subDays(2),
        ]);

        $booking->rooms()->attach($room->id, [
            'price_per_night' => 200,
            'nights' => 3,
            'subtotal' => 600,
            'net_subtotal' => 600,
        ]);

        return $booking;
    }

    public function test_public_reviews_list_is_approved_only(): void
    {
        [$resort, $room] = $this->resortWithRoom();
        $user = $this->customer();

        Review::create([
            'user_id' => $user->id,
            'booking_id' => null,
            'room_id' => $room->id,
            'resort_id' => $resort->id,
            'rating' => 5,
            'title' => 'Pending',
            'comment' => 'Should not appear',
            'status' => 'pending',
        ]);

        $approved = Review::create([
            'user_id' => $user->id,
            'booking_id' => null,
            'room_id' => $room->id,
            'resort_id' => $resort->id,
            'rating' => 5,
            'title' => 'Amazing',
            'comment' => 'Great stay',
            'status' => 'approved',
        ]);

        $this->getJson('/api/customer/reviews?status=pending')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $approved->id);

        $this->getJson('/api/customer/reviews?status=approved&per_page=6')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $approved->id)
            ->assertJsonMissingPath('data.0.user.email')
            ->assertJsonMissingPath('data.0.user.id')
            ->assertJsonMissingPath('data.0.status')
            ->assertJsonMissingPath('data.0.booking')
            ->assertJsonMissingPath('data.0.room.id');
    }

    public function test_customer_can_submit_review_for_completed_stay(): void
    {
        [$resort, $room] = $this->resortWithRoom();
        $user = $this->customer();
        $this->completedBooking($user, $resort, $room);

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/customer/reviews', [
            'room_id' => $room->id,
            'rating' => 5,
            'title' => 'Amazing stay',
            'comment' => 'The room was excellent.',
        ])->assertCreated();

        $this->assertDatabaseHas('reviews', [
            'user_id' => $user->id,
            'room_id' => $room->id,
            'status' => 'pending',
            'rating' => 5,
        ]);

        $response->assertJsonPath('data.status', 'pending');
    }

    public function test_cannot_review_room_from_another_customers_booking(): void
    {
        [$resort, $room] = $this->resortWithRoom();
        $owner = $this->customer('owner@example.com');
        $intruder = $this->customer('intruder@example.com');
        $this->completedBooking($owner, $resort, $room);

        Sanctum::actingAs($intruder);

        $this->postJson('/api/customer/reviews', [
            'room_id' => $room->id,
            'rating' => 5,
            'comment' => 'Not my room',
        ])->assertStatus(422);
    }

    public function test_duplicate_review_is_rejected(): void
    {
        [$resort, $room] = $this->resortWithRoom();
        $user = $this->customer();
        $booking = $this->completedBooking($user, $resort, $room);

        Review::create([
            'user_id' => $user->id,
            'booking_id' => $booking->id,
            'room_id' => $room->id,
            'resort_id' => $resort->id,
            'rating' => 4,
            'comment' => 'First review',
            'status' => 'approved',
        ]);

        Sanctum::actingAs($user);

        $this->postJson('/api/customer/reviews', [
            'room_id' => $room->id,
            'rating' => 5,
            'comment' => 'Second review',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['room_id']);
    }

    public function test_invalid_rating_is_rejected(): void
    {
        [$resort, $room] = $this->resortWithRoom();
        $user = $this->customer();
        $this->completedBooking($user, $resort, $room);

        Sanctum::actingAs($user);

        $this->postJson('/api/customer/reviews', [
            'room_id' => $room->id,
            'rating' => 0,
            'comment' => 'Bad rating',
        ])->assertStatus(422);

        $this->postJson('/api/customer/reviews', [
            'room_id' => $room->id,
            'rating' => 6,
            'comment' => 'Bad rating',
        ])->assertStatus(422);

        $this->postJson('/api/customer/reviews', [
            'room_id' => $room->id,
            'rating' => 'abc',
            'comment' => 'Bad rating',
        ])->assertStatus(422);
    }
}
