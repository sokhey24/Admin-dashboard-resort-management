<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Payment;
use App\Models\Resort;
use App\Models\Role;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\User;
use App\Services\StripePaymentService;
use Laravel\Sanctum\Sanctum;
use Mockery;
use Stripe\PaymentIntent;
use Stripe\StripeClient;
use Tests\TestCase;

class StripePaymentTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.stripe.key' => 'pk_test_solara',
            'services.stripe.secret' => 'sk_test_solara',
            'services.stripe.webhook_secret' => 'whsec_test_solara_secret',
            'services.stripe.currency' => 'USD',
        ]);
    }

    protected function customer(string $email = 'stripe-guest@example.com'): User
    {
        $user = User::create([
            'name' => 'Stripe Guest',
            'email' => $email,
            'password' => bcrypt('password123'),
        ]);
        $role = Role::firstOrCreate(['name' => 'customer'], ['display_name' => 'Customer']);
        $user->roles()->attach($role->id);

        return $user;
    }

    protected function bookingFor(User $user): Booking
    {
        $resort = Resort::create(['name' => 'R', 'slug' => 'r-stripe', 'address' => 'a', 'city' => 'c']);
        $type = RoomType::create([
            'resort_id' => $resort->id,
            'name' => 'Std',
            'base_price' => 100,
            'max_occupancy' => 4,
        ]);
        $room = Room::create([
            'resort_id' => $resort->id,
            'room_type_id' => $type->id,
            'room_number' => 'S-1',
            'price_per_night' => 100,
            'status' => 'available',
        ]);

        Sanctum::actingAs($user);

        $id = $this->postJson('/api/customer/bookings', [
            'resort_id' => $resort->id,
            'room_ids' => [$room->id],
            'check_in' => '2027-09-01',
            'check_out' => '2027-09-03',
            'adults' => 2,
        ])->assertCreated()->json('data.id');

        return Booking::findOrFail($id);
    }

    protected function pendingStripePayment(Booking $booking, User $actor, ?string $intentId = 'pi_test_solara_1'): Payment
    {
        $amount = app(\App\Services\FolioService::class)->outstandingBalance($booking);

        return Payment::create([
            'booking_id' => $booking->id,
            'user_id' => $booking->user_id,
            'source' => 'resort',
            'reference_type' => Booking::class,
            'reference_id' => $booking->id,
            'amount' => $amount,
            'method' => 'credit_card',
            'payment_method' => 'credit_card',
            'gateway' => 'stripe',
            'currency' => 'USD',
            'paid_amount' => 0,
            'balance' => $amount,
            'status' => 'pending',
            'created_by' => $actor->id,
            'transaction_ref' => 'STR-TEST',
            'stripe_payment_intent_id' => $intentId,
            'payment_reference' => $intentId,
        ]);
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function succeededIntentArray(Payment $payment, array $overrides = []): array
    {
        $minor = app(StripePaymentService::class)->toMinorUnits((float) $payment->amount, 'USD');

        return array_merge([
            'id' => $payment->stripe_payment_intent_id,
            'object' => 'payment_intent',
            'amount' => $minor,
            'amount_received' => $minor,
            'currency' => 'usd',
            'status' => 'succeeded',
            'metadata' => [
                'booking_id' => (string) $payment->booking_id,
                'payment_id' => (string) $payment->id,
            ],
            'charges' => [
                'data' => [[
                    'payment_method_details' => [
                        'card' => ['last4' => '4242', 'brand' => 'visa'],
                    ],
                ]],
            ],
        ], $overrides);
    }

    protected function stripeSignatureHeader(string $payload, string $secret): string
    {
        $timestamp = time();
        $signedPayload = $timestamp.'.'.$payload;
        $signature = hash_hmac('sha256', $signedPayload, $secret);

        return "t={$timestamp},v1={$signature}";
    }

    protected function withMockedStripeClient(callable $configurePaymentIntents): void
    {
        $paymentIntents = Mockery::mock();
        $configurePaymentIntents($paymentIntents);

        $client = Mockery::mock(StripeClient::class);
        $client->paymentIntents = $paymentIntents;

        $this->app->instance(StripeClient::class, $client);
    }

    protected function postStripeWebhook(array $event): void
    {
        $payload = json_encode($event, JSON_THROW_ON_ERROR);
        $sig = $this->stripeSignatureHeader(
            $payload,
            (string) config('services.stripe.webhook_secret')
        );

        $this->call(
            'POST',
            '/api/stripe/webhook',
            [],
            [],
            [],
            [
                'HTTP_Stripe-Signature' => $sig,
                'CONTENT_TYPE' => 'application/json',
            ],
            $payload
        )->assertOk();
    }

    protected function mockStripeClientForIntentCreate(string $intentId = 'pi_mock_create'): void
    {
        $this->withMockedStripeClient(function ($paymentIntents) use ($intentId) {
            $paymentIntents->shouldReceive('create')
                ->once()
                ->andReturn(PaymentIntent::constructFrom([
                    'id' => $intentId,
                    'client_secret' => 'cs_test_mock_secret',
                    'status' => 'requires_payment_method',
                    'amount' => 10000,
                    'currency' => 'usd',
                ]));

            $paymentIntents->shouldReceive('retrieve')
                ->andReturn(PaymentIntent::constructFrom([
                    'id' => $intentId,
                    'client_secret' => 'cs_test_mock_secret',
                    'status' => 'requires_payment_method',
                    'amount' => 10000,
                    'currency' => 'usd',
                    'metadata' => [],
                ]));
        });
    }

    public function test_guest_cannot_create_stripe_intent_for_another_users_booking(): void
    {
        $owner = $this->customer('owner@example.com');
        $intruder = $this->customer('intruder@example.com');
        $booking = $this->bookingFor($owner);

        Sanctum::actingAs($intruder);

        $this->postJson("/api/customer/bookings/{$booking->id}/stripe/payment-intent")
            ->assertForbidden();
    }

    public function test_stripe_intent_amount_follows_server_balance(): void
    {
        $user = $this->customer();
        $booking = $this->bookingFor($user);
        $expected = app(\App\Services\FolioService::class)->outstandingBalance($booking);

        $this->mockStripeClientForIntentCreate('pi_amount_check');

        Sanctum::actingAs($user);
        $response = $this->postJson("/api/customer/bookings/{$booking->id}/stripe/payment-intent", [
            'client_request_id' => 'req-amount-1',
        ])->assertCreated();

        $this->assertEqualsWithDelta($expected, (float) $response->json('data.amount'), 0.009);
        $this->assertSame('USD', $response->json('data.currency'));
        $this->assertNotEmpty($response->json('data.client_secret'));
    }

    public function test_duplicate_client_request_id_reuses_pending_intent_without_second_create(): void
    {
        $user = $this->customer();
        $booking = $this->bookingFor($user);

        $minor = app(StripePaymentService::class)->toMinorUnits(
            app(\App\Services\FolioService::class)->outstandingBalance($booking),
            'USD'
        );

        $this->withMockedStripeClient(function ($paymentIntents) use ($minor) {
            $paymentIntents->shouldReceive('create')->once()->andReturn(PaymentIntent::constructFrom([
                'id' => 'pi_dedupe_1',
                'client_secret' => 'cs_test_dedupe',
                'status' => 'requires_payment_method',
            ]));
            $paymentIntents->shouldReceive('retrieve')->andReturn(PaymentIntent::constructFrom([
                'id' => 'pi_dedupe_1',
                'client_secret' => 'cs_test_dedupe',
                'status' => 'requires_payment_method',
                'amount' => $minor,
                'currency' => 'usd',
                'metadata' => [],
            ]));
        });

        Sanctum::actingAs($user);

        $first = $this->postJson("/api/customer/bookings/{$booking->id}/stripe/payment-intent", [
            'client_request_id' => 'req-dedupe-abc',
        ])->assertCreated();

        $second = $this->postJson("/api/customer/bookings/{$booking->id}/stripe/payment-intent", [
            'client_request_id' => 'req-dedupe-abc',
        ])->assertCreated();

        $this->assertSame($first->json('data.id'), $second->json('data.id'));
        $this->assertSame('pi_dedupe_1', $second->json('data.stripe_payment_intent_id'));
    }

    public function test_webhook_rejects_invalid_signature(): void
    {
        $this->post('/api/stripe/webhook', [], ['Stripe-Signature' => 'invalid'])
            ->assertStatus(400);
    }

    public function test_webhook_settles_payment_and_is_idempotent_per_event(): void
    {
        $user = $this->customer();
        $booking = $this->bookingFor($user);
        $payment = $this->pendingStripePayment($booking, $user);

        $event = [
            'id' => 'evt_stripe_settle_1',
            'object' => 'event',
            'type' => 'payment_intent.succeeded',
            'data' => ['object' => $this->succeededIntentArray($payment)],
        ];

        $this->postStripeWebhook($event);
        $this->postStripeWebhook($event);

        $payment->refresh();
        $booking->refresh();

        $this->assertSame('paid', $payment->status);
        $this->assertSame('4242', $payment->card_last4);
        $this->assertSame('visa', $payment->card_brand);
        $this->assertEqualsWithDelta(0.0, (float) $booking->balance_due, 0.01);
        $this->assertSame(1, Payment::query()->where('booking_id', $booking->id)->where('status', 'paid')->count());
    }

    public function test_webhook_rejects_amount_mismatch(): void
    {
        $user = $this->customer();
        $booking = $this->bookingFor($user);
        $payment = $this->pendingStripePayment($booking, $user);

        $badIntent = $this->succeededIntentArray($payment, [
            'amount_received' => 1,
            'amount' => 1,
        ]);

        $this->postStripeWebhook([
            'id' => 'evt_mismatch_1',
            'object' => 'event',
            'type' => 'payment_intent.succeeded',
            'data' => ['object' => $badIntent],
        ]);

        $payment->refresh();
        $this->assertSame('failed', $payment->status);
        $booking->refresh();
        $this->assertGreaterThan(0, (float) $booking->balance_due);
    }

    public function test_sync_endpoint_confirms_succeeded_intent_from_stripe(): void
    {
        $user = $this->customer();
        $booking = $this->bookingFor($user);
        $payment = $this->pendingStripePayment($booking, $user, 'pi_sync_test');

        $intentArray = $this->succeededIntentArray($payment);

        $this->withMockedStripeClient(function ($paymentIntents) use ($intentArray) {
            $paymentIntents->shouldReceive('retrieve')
                ->once()
                ->with('pi_sync_test')
                ->andReturn(PaymentIntent::constructFrom($intentArray));
        });

        Sanctum::actingAs($user);

        $this->postJson("/api/customer/payments/{$payment->id}/stripe/sync")
            ->assertOk()
            ->assertJsonPath('paid', true);

        $booking->refresh();
        $this->assertEqualsWithDelta(0.0, (float) $booking->balance_due, 0.01);
    }

    public function test_khqr_flow_still_works_when_stripe_is_configured(): void
    {
        $user = $this->customer('khqr-stripe-coexist@example.com');
        $booking = $this->bookingFor($user);

        $mock = Mockery::mock(\App\Services\BakongKhqrService::class);
        $mock->shouldReceive('generate')->once()->andReturn([
            'qr' => 'QR-DATA',
            'md5' => 'aabbccddeeff00112233445566778899',
        ]);
        $this->app->instance(\App\Services\BakongKhqrService::class, $mock);

        Sanctum::actingAs($user);

        $paymentId = $this->postJson("/api/customer/bookings/{$booking->id}/khqr", ['gateway' => 'aba-khqr'])
            ->assertCreated()
            ->json('data.id');

        $payment = Payment::findOrFail($paymentId);
        $this->assertSame('bakong', $payment->gateway);
        $this->assertNotEmpty($payment->qr_payload);
    }

    protected function tearDown(): void
    {
        $this->app->forgetInstance(StripeClient::class);
        Mockery::close();
        parent::tearDown();
    }
}
