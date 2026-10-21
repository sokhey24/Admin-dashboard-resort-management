<?php

namespace Tests\Feature;

use App\Models\ContactInquiry;
use App\Models\User;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ContactInquiryTest extends TestCase
{
    private function validPayload(array $overrides = []): array
    {
        return array_merge([
            'guest_name' => 'Test Guest',
            'guest_email' => 'test@example.com',
            'guest_phone' => '+85512345678',
            'resort_name' => 'Solara Koh Rong',
            'subject' => 'general',
            'message' => 'Looking forward to visiting next month.',
        ], $overrides);
    }

    public function test_guest_can_create_pending_contact_inquiry(): void
    {
        $response = $this->postJson('/api/customer/contact-inquiries', $this->validPayload());

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'pending');

        $this->assertDatabaseHas('contact_inquiries', [
            'guest_email' => 'test@example.com',
            'status' => 'pending',
            'user_id' => null,
        ]);
    }

    public function test_authenticated_user_id_is_set_from_token(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/customer/contact-inquiries', $this->validPayload())
            ->assertCreated();

        $this->assertDatabaseHas('contact_inquiries', [
            'user_id' => $user->id,
            'status' => 'pending',
        ]);
    }

    public function test_client_cannot_set_user_id_or_status(): void
    {
        $intruder = User::factory()->create();

        $this->postJson('/api/customer/contact-inquiries', $this->validPayload([
            'user_id' => $intruder->id,
            'status' => 'confirmed',
        ]))->assertCreated();

        $inquiry = ContactInquiry::first();
        $this->assertNull($inquiry->user_id);
        $this->assertSame('pending', $inquiry->status);
    }

    public function test_validation_rejects_invalid_subject_and_empty_message(): void
    {
        $this->postJson('/api/customer/contact-inquiries', $this->validPayload([
            'subject' => 'invalid',
        ]))->assertStatus(422);

        $this->postJson('/api/customer/contact-inquiries', $this->validPayload([
            'message' => '',
        ]))->assertStatus(422);

        $this->postJson('/api/customer/contact-inquiries', $this->validPayload([
            'guest_email' => 'not-an-email',
        ]))->assertStatus(422);
    }
}
