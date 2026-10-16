<?php

namespace Tests\Feature;

use App\Models\ServiceInquiry;
use App\Models\User;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ServiceInquiryTest extends TestCase
{

    private function validPayload(array $overrides = []): array
    {
        return array_merge([
            'service_title' => 'Celestial Lotus Spa & Wellness Sanctuary',
            'service_id' => 'srv-spa',
            'preferred_date' => now()->addDay()->format('Y-m-d'),
            'resort_name' => 'Solara Koh Rong',
            'guest_count' => 2,
            'guest_name' => 'Test Guest',
            'guest_email' => 'test@example.com',
            'guest_phone' => '+85512345678',
            'special_requests' => 'Massage preferences',
        ], $overrides);
    }

    public function test_guest_can_create_pending_service_inquiry(): void
    {
        $response = $this->postJson('/api/customer/service-inquiries', $this->validPayload());

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'pending');

        $this->assertDatabaseHas('service_inquiries', [
            'service_title' => 'Celestial Lotus Spa & Wellness Sanctuary',
            'status' => 'pending',
            'user_id' => null,
        ]);
    }

    public function test_authenticated_user_id_is_set_from_token(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/customer/service-inquiries', $this->validPayload())
            ->assertCreated();

        $this->assertDatabaseHas('service_inquiries', [
            'user_id' => $user->id,
            'status' => 'pending',
        ]);
    }

    public function test_client_cannot_set_user_id_or_status(): void
    {
        $intruder = User::factory()->create();

        $this->postJson('/api/customer/service-inquiries', $this->validPayload([
            'user_id' => $intruder->id,
            'status' => 'confirmed',
        ]))->assertCreated();

        $inquiry = ServiceInquiry::first();
        $this->assertNull($inquiry->user_id);
        $this->assertSame('pending', $inquiry->status);
    }

    public function test_validation_rejects_past_date_and_invalid_guest_count(): void
    {
        $this->postJson('/api/customer/service-inquiries', $this->validPayload([
            'preferred_date' => now()->subDay()->format('Y-m-d'),
        ]))->assertStatus(422);

        $this->postJson('/api/customer/service-inquiries', $this->validPayload([
            'guest_count' => 0,
        ]))->assertStatus(422);

        $this->postJson('/api/customer/service-inquiries', $this->validPayload([
            'service_title' => '',
        ]))->assertStatus(422);

        $this->postJson('/api/customer/service-inquiries', $this->validPayload([
            'guest_email' => 'not-an-email',
        ]))->assertStatus(422);

        $this->postJson('/api/customer/service-inquiries', $this->validPayload([
            'resort_name' => '',
        ]))->assertStatus(422);
    }
}
