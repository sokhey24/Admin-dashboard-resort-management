<?php

namespace App\Services;

use App\Events\BookingPaid;
use App\Models\Booking;
use App\Models\DomainTaskDedupe;
use App\Models\Payment;
use App\Models\PaymentTransaction;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Stripe\Exception\SignatureVerificationException;
use Stripe\StripeClient;
use Stripe\Webhook;

class StripePaymentService
{
    /** @var list<string> */
    private const ZERO_DECIMAL_CURRENCIES = [
        'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF',
        'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF',
    ];

    public function __construct(
        protected PaymentService $payments,
        protected BookingService $bookings,
        protected FolioService $folios,
    ) {}

    public function isEnabled(): bool
    {
        return filled(config('services.stripe.secret')) && filled(config('services.stripe.key'));
    }

    public function publishableKey(): ?string
    {
        $key = config('services.stripe.key');

        return $key ? (string) $key : null;
    }

    protected function client(): StripeClient
    {
        $secret = config('services.stripe.secret');
        if (! $secret) {
            throw ValidationException::withMessages([
                'stripe' => ['Card payments are not configured on this server.'],
            ]);
        }

        if (app()->bound(StripeClient::class)) {
            return app(StripeClient::class);
        }

        return new StripeClient((string) $secret);
    }

    public function toMinorUnits(float $amount, string $currency): int
    {
        $currency = strtoupper($currency);
        if (in_array($currency, self::ZERO_DECIMAL_CURRENCIES, true)) {
            return (int) round($amount);
        }

        return (int) round($amount * 100);
    }

    public function fromMinorUnits(int $minor, string $currency): float
    {
        $currency = strtoupper($currency);
        if (in_array($currency, self::ZERO_DECIMAL_CURRENCIES, true)) {
            return (float) $minor;
        }

        return round($minor / 100, 2);
    }

    /**
     * @return array<string, mixed>
     */
    public function createPaymentIntent(Booking $booking, User $actor, ?string $clientRequestId = null): array
    {
        if (! $this->isEnabled()) {
            throw ValidationException::withMessages(['stripe' => ['Card payments are unavailable.']]);
        }

        $this->bookings->assertAccessible($booking, $actor);
        $booking = Booking::with(['rooms', 'payments'])->findOrFail($booking->id);
        $this->payments->assertBookingPayable($booking, $actor);

        if ($clientRequestId) {
            $prior = Payment::query()
                ->where('client_request_id', $clientRequestId)
                ->where('gateway', 'stripe')
                ->first();
            if ($prior?->stripe_payment_intent_id) {
                return $this->resolveIntentResponse($prior);
            }
        }

        $remaining = $this->folios->outstandingBalance($booking);
        if ($remaining <= 0) {
            throw ValidationException::withMessages(['amount' => ['This booking is already fully paid.']]);
        }

        $currency = strtoupper((string) config('services.stripe.currency', 'USD'));
        $totals = $this->payments->bookingTotals($booking);
        $chargesTotal = $this->folios->ledgerFor($booking)['charges_total'];
        $ratio = $chargesTotal > 0 ? ($remaining / $chargesTotal) : 1;

        $reusable = Payment::query()
            ->where('booking_id', $booking->id)
            ->where('gateway', 'stripe')
            ->where('status', 'pending')
            ->whereNotNull('stripe_payment_intent_id')
            ->latest('id')
            ->first();

        if ($reusable) {
            $resolved = $this->resolveIntentResponse($reusable);
            if ($resolved !== null) {
                return $resolved;
            }
        }

        $payment = null;
        $clientSecret = null;

        DB::transaction(function () use ($booking, $actor, $remaining, $currency, $totals, $ratio, $clientRequestId, &$payment, &$clientSecret) {
            $payment = Payment::create([
                'booking_id' => $booking->id,
                'user_id' => $booking->user_id,
                'source' => 'resort',
                'reference_type' => Booking::class,
                'reference_id' => $booking->id,
                'amount' => $remaining,
                'method' => 'credit_card',
                'payment_method' => 'credit_card',
                'gateway' => 'stripe',
                'currency' => $currency,
                'subtotal' => round($totals['subtotal'] * $ratio, 2),
                'discount' => round($totals['discount'] * $ratio, 2),
                'tax' => round($totals['tax'] * $ratio, 2),
                'service_charge' => round($totals['service'] * $ratio, 2),
                'paid_amount' => 0,
                'balance' => $remaining,
                'status' => 'pending',
                'created_by' => $actor->id,
                'transaction_ref' => 'STR-'.strtoupper(uniqid()),
                'client_request_id' => $clientRequestId,
            ]);

            $idempotencyKey = $clientRequestId
                ? 'solara-pi-'.$clientRequestId
                : 'solara-pi-booking-'.$booking->id.'-'.$payment->id;

            $intent = $this->client()->paymentIntents->create([
                'amount' => $this->toMinorUnits($remaining, $currency),
                'currency' => strtolower($currency),
                'automatic_payment_methods' => ['enabled' => true],
                'metadata' => [
                    'booking_id' => (string) $booking->id,
                    'payment_id' => (string) $payment->id,
                    'user_id' => (string) $booking->user_id,
                ],
            ], ['idempotency_key' => $idempotencyKey]);

            $payment->update([
                'stripe_payment_intent_id' => $intent->id,
                'payment_reference' => $intent->id,
            ]);

            PaymentTransaction::create([
                'payment_id' => $payment->id,
                'gateway' => 'stripe',
                'gateway_ref' => $intent->id,
                'amount' => $remaining,
                'status' => 'pending',
                'response_data' => ['type' => 'stripe_intent_created', 'status' => $intent->status],
            ]);

            $clientSecret = $intent->client_secret;
        });

        return $this->formatIntentPayload($payment->fresh(), $clientSecret);
    }

    /**
     * Server-side sync after Payment Element confirmation (never trusts client amount).
     *
     * @return array{status: string, paid: bool, message: string, payment?: Payment}
     */
    public function syncPaymentIntent(Payment $payment, User $actor): array
    {
        $this->assertPaymentOwnedByActor($payment, $actor);

        if ($payment->status === 'paid') {
            return ['status' => 'paid', 'paid' => true, 'message' => 'Payment already recorded.', 'payment' => $payment];
        }

        if ($payment->gateway !== 'stripe' || ! $payment->stripe_payment_intent_id) {
            throw ValidationException::withMessages(['payment' => ['Not a Stripe payment.']]);
        }

        $intent = $this->client()->paymentIntents->retrieve($payment->stripe_payment_intent_id);

        if ($intent->status === 'succeeded') {
            return $this->settleFromIntentObject($payment, $intent->toArray());
        }

        if (in_array($intent->status, ['canceled', 'requires_payment_method'], true)) {
            $payment->update(['status' => 'failed', 'note' => 'Stripe: '.$intent->status]);

            return ['status' => 'failed', 'paid' => false, 'message' => 'Card payment was not completed.'];
        }

        return ['status' => 'pending', 'paid' => false, 'message' => 'Payment is still processing.'];
    }

    public function handleWebhook(string $payload, ?string $signatureHeader): void
    {
        $secret = config('services.stripe.webhook_secret');
        if (! $secret || ! $signatureHeader) {
            abort(400, 'Webhook not configured.');
        }

        try {
            $event = Webhook::constructEvent($payload, $signatureHeader, $secret);
        } catch (SignatureVerificationException $e) {
            Log::warning('Stripe webhook signature invalid', ['error' => $e->getMessage()]);
            abort(400, 'Invalid signature.');
        }

        $dedupeKey = 'stripe_evt_'.$event->id;
        if (DomainTaskDedupe::query()->where('task_key', $dedupeKey)->exists()) {
            return;
        }

        DomainTaskDedupe::query()->create([
            'task_key' => $dedupeKey,
            'created_at' => now(),
        ]);

        $type = $event->type;
        $object = $event->data->object ?? null;

        if ($type === 'payment_intent.succeeded' && $object) {
            $payment = $this->findPaymentForIntentId($object->id ?? null);
            if ($payment) {
                $this->settleFromIntentObject($payment, $object->toArray());
            }

            return;
        }

        if ($type === 'payment_intent.payment_failed' && $object) {
            $payment = $this->findPaymentForIntentId($object->id ?? null);
            if ($payment && $payment->status === 'pending') {
                $payment->update([
                    'status' => 'failed',
                    'note' => 'Stripe payment failed',
                ]);
            }
        }
    }

    /**
     * @param  array<string, mixed>  $intent
     * @return array{status: string, paid: bool, message: string, payment?: Payment}
     */
    public function settleFromIntentObject(Payment $payment, array $intent): array
    {
        if ($payment->status === 'paid') {
            return ['status' => 'paid', 'paid' => true, 'message' => 'Already settled.', 'payment' => $payment];
        }

        if (! $this->intentMatchesPayment($payment, $intent)) {
            $payment->update(['status' => 'failed', 'note' => 'Stripe amount or reference mismatch']);
            Log::warning('Stripe settlement rejected', [
                'payment_id' => $payment->id,
                'intent_id' => $intent['id'] ?? null,
            ]);

            return ['status' => 'failed', 'paid' => false, 'message' => 'Payment could not be reconciled.'];
        }

        [$cardLast4, $cardBrand] = $this->cardDetailsFromIntent($intent);

        $settled = $this->payments->settleResortPaymentRecord($payment, [
            'gateway' => 'stripe',
            'gateway_ref' => (string) ($intent['id'] ?? $payment->stripe_payment_intent_id),
            'payment_reference' => (string) ($intent['id'] ?? ''),
            'card_last4' => $cardLast4,
            'card_brand' => $cardBrand,
            'response_data' => ['type' => 'stripe_settled', 'intent' => ['id' => $intent['id'] ?? null, 'status' => $intent['status'] ?? null]],
        ]);

        if ($settled['newly_settled'] && $settled['payment']->booking_id) {
            event(new BookingPaid((int) $settled['payment']->booking_id, (int) $settled['payment']->id));
        }

        return [
            'status' => 'paid',
            'paid' => true,
            'message' => 'Payment confirmed.',
            'payment' => $settled['payment'],
        ];
    }

    protected function findPaymentForIntentId(?string $intentId): ?Payment
    {
        if (! $intentId) {
            return null;
        }

        return Payment::query()
            ->where('stripe_payment_intent_id', $intentId)
            ->where('gateway', 'stripe')
            ->first();
    }

    /**
     * @param  array<string, mixed>  $intent
     */
    protected function intentMatchesPayment(Payment $payment, array $intent): bool
    {
        $meta = $intent['metadata'] ?? [];
        $bookingId = (int) ($meta['booking_id'] ?? 0);
        $paymentId = (int) ($meta['payment_id'] ?? 0);

        if ($bookingId && (int) $payment->booking_id !== $bookingId) {
            return false;
        }
        if ($paymentId && (int) $payment->id !== $paymentId) {
            return false;
        }

        $currency = strtoupper((string) ($intent['currency'] ?? $payment->currency));
        if (strtoupper((string) $payment->currency) !== $currency) {
            return false;
        }

        $minor = (int) ($intent['amount_received'] ?? $intent['amount'] ?? 0);
        $expectedMinor = $this->toMinorUnits((float) $payment->amount, $currency);

        return $minor === $expectedMinor;
    }

    /**
     * @return array<string, mixed>|null
     */
    protected function resolveIntentResponse(Payment $payment): ?array
    {
        if (! $payment->stripe_payment_intent_id) {
            return null;
        }

        $intent = $this->client()->paymentIntents->retrieve($payment->stripe_payment_intent_id);

        if ($intent->status === 'succeeded') {
            $this->settleFromIntentObject($payment, $intent->toArray());

            return null;
        }

        if (in_array($intent->status, ['requires_payment_method', 'requires_confirmation', 'requires_action', 'processing'], true)) {
            if (! $this->intentMatchesPayment($payment, $intent->toArray())) {
                return null;
            }

            return $this->formatIntentPayload($payment, $intent->client_secret);
        }

        return null;
    }

    /**
     * @return array<string, mixed>
     */
    protected function formatIntentPayload(Payment $payment, ?string $clientSecret): array
    {
        return [
            'payment_id' => $payment->payment_id,
            'id' => $payment->id,
            'amount' => (float) $payment->amount,
            'currency' => $payment->currency,
            'status' => $payment->status,
            'client_secret' => $clientSecret,
            'publishable_key' => $this->publishableKey(),
            'stripe_payment_intent_id' => $payment->stripe_payment_intent_id,
            'booking_id' => $payment->booking_id,
        ];
    }

    protected function assertPaymentOwnedByActor(Payment $payment, User $actor): void
    {
        $this->payments->assertAccessible($payment, $actor);
        if ($actor->isGuestAccount() && (int) $payment->user_id !== (int) $actor->id) {
            abort(403, 'You cannot access this payment.');
        }
    }

    /**
     * @param  array<string, mixed>  $intent
     * @return array{0: ?string, 1: ?string}
     */
    protected function cardDetailsFromIntent(array $intent): array
    {
        $charge = $intent['charges']['data'][0] ?? null;
        if (is_array($charge)) {
            $card = $charge['payment_method_details']['card'] ?? null;
            if (is_array($card)) {
                return [$card['last4'] ?? null, $card['brand'] ?? null];
            }
        }

        $latest = $intent['latest_charge'] ?? null;
        if (is_array($latest)) {
            $card = $latest['payment_method_details']['card'] ?? null;
            if (is_array($card)) {
                return [$card['last4'] ?? null, $card['brand'] ?? null];
            }
        }

        if (is_string($latest) && $latest !== '') {
            try {
                $chargeObj = $this->client()->charges->retrieve($latest);
                $card = $chargeObj->payment_method_details->card ?? null;

                return [$card->last4 ?? null, $card->brand ?? null];
            } catch (\Throwable) {
                return [null, null];
            }
        }

        return [null, null];
    }
}
