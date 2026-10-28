<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AIChatTest extends TestCase
{
    use RefreshDatabase;

    public function test_ai_chat_requires_messages(): void
    {
        $response = $this->postJson('/api/customer/ai/chat', []);

        $response->assertStatus(422)->assertJsonValidationErrors(['messages']);
    }

    public function test_ai_chat_returns_reply_when_gemini_succeeds(): void
    {
        config(['services.gemini.api_key' => 'test-key', 'services.gemini.model' => 'gemini-2.5-flash']);

        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                ['text' => 'Welcome to Solara Resort.'],
                            ],
                        ],
                    ],
                ],
            ], 200),
        ]);

        $response = $this->postJson('/api/customer/ai/chat', [
            'messages' => [
                ['role' => 'user', 'text' => 'Hello'],
            ],
            'language' => 'en',
        ]);

        $response->assertOk()->assertJson([
            'reply' => 'Welcome to Solara Resort.',
        ]);
    }

    public function test_ai_chat_returns_503_when_key_missing(): void
    {
        config(['services.gemini.api_key' => null]);

        $response = $this->postJson('/api/customer/ai/chat', [
            'messages' => [
                ['role' => 'user', 'text' => 'Hello'],
            ],
        ]);

        $response->assertStatus(503);
    }
}
