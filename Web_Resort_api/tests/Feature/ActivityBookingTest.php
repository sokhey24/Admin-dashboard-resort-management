<?php

namespace Tests\Feature;

use App\Models\ActivityBooking;
use App\Models\User;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ActivityBookingTest extends TestCase
{

    private function validPayload(array $overrides = []): array
    {
        return array_merge([
            'activity_title' => 'Sunset Cruise',
            'activity_id' => 'activity-01',
            'booking_date' => now()->addDay()->format('Y-m-d'),
            'guest_count' => 2,
            'total_price' => 80,
            'guest_name' => 'Test Guest',
            'guest_email' => 'test@example.com',
            'guest_phone' => '+85512345678',
            'special_requests' => 'Vegetarian meal',
        ], $overrides);
    }

    public function test_guest_can_create_pending_activity_booking(): void
    {
        $response = $this->postJson('/api/customer/activity-bookings', $this->validPayload());

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'pending');

        $this->assertDatabaseHas('activity_bookings', [
            'activity_title' => 'Sunset Cruise',
            'status' => 'pending',
            'user_id' => null,
        ]);
    }

    public function test_authenticated_user_id_is_set_from_token(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/customer/activity-bookings', $this->validPayload())
            ->assertCreated();

        $this->assertDatabaseHas('activity_bookings', [
            'user_id' => $user->id,
            'status' => 'pending',
        ]);
    }

    public function test_client_cannot_set_user_id_or_status(): void
    {
        $intruder = User::factory()->create();

        $this->postJson('/api/customer/activity-bookings', $this->validPayload([
            'user_id' => $intruder->id,
            'status' => 'confirmed',
        ]))->assertCreated();

        $booking = ActivityBooking::first();
        $this->assertNull($booking->user_id);
        $this->assertSame('pending', $booking->status);
    }

    public function test_validation_rejects_past_date_and_invalid_guest_count(): void
    {
        $this->postJson('/api/customer/activity-bookings', $this->validPayload([
            'booking_date' => now()->subDay()->format('Y-m-d'),
        ]))->assertStatus(422);

        $this->postJson('/api/customer/activity-bookings', $this->validPayload([
            'guest_count' => 0,
        ]))->assertStatus(422);

        $this->postJson('/api/customer/activity-bookings', $this->validPayload([
            'guest_count' => 51,
        ]))->assertStatus(422);

        $this->postJson('/api/customer/activity-bookings', $this->validPayload([
            'activity_title' => '',
        ]))->assertStatus(422);

        $this->postJson('/api/customer/activity-bookings', $this->validPayload([
            'guest_email' => 'not-an-email',
        ]))->assertStatus(422);

        $this->postJson('/api/customer/activity-bookings', $this->validPayload([
            'guest_name' => '',
        ]))->assertStatus(422);

        $this->postJson('/api/customer/activity-bookings', $this->validPayload([
            'guest_phone' => '',
        ]))->assertStatus(422);
    }
}
