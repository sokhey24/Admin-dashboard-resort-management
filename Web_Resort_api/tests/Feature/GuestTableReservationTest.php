<?php

namespace Tests\Feature;

use App\Models\TableReservation;
use App\Models\User;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GuestTableReservationTest extends TestCase
{
    private function validPayload(array $overrides = []): array
    {
        return array_merge([
            'reservation_date' => now()->addDay()->format('Y-m-d'),
            'reservation_time' => '19:30',
            'guest_count' => 2,
            'guest_name' => 'Test Guest',
            'guest_email' => 'test@example.com',
            'guest_phone' => '+85512345678',
            'note' => 'Window seat if possible',
        ], $overrides);
    }

    public function test_guest_can_create_pending_table_reservation_request(): void
    {
        $response = $this->postJson('/api/customer/table-reservation-requests', $this->validPayload());

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'pending');

        $this->assertDatabaseHas('table_reservations', [
            'guest_name' => 'Test Guest',
            'status' => 'pending',
            'user_id' => null,
            'restaurant_table_id' => null,
        ]);
    }

    public function test_authenticated_user_id_is_set_from_token(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/customer/table-reservation-requests', $this->validPayload())
            ->assertCreated();

        $this->assertDatabaseHas('table_reservations', [
            'user_id' => $user->id,
            'status' => 'pending',
        ]);
    }

    public function test_validation_rejects_past_date(): void
    {
        $this->postJson('/api/customer/table-reservation-requests', $this->validPayload([
            'reservation_date' => now()->subDay()->format('Y-m-d'),
        ]))->assertStatus(422);
    }
}
