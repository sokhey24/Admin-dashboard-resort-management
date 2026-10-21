<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\Booking;
use App\Models\FolioCharge;
use App\Models\FoodOrder;
use App\Models\Guest;
use App\Models\GuestFolio;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class FolioService
{
    public function __construct(
        protected BookingService $bookings,
        protected PaymentReceiptService $receipts,
    ) {}

    public function openFolio(Booking $booking, ?User $actor = null): GuestFolio
    {
        $booking->loadMissing(['user']);

        return DB::transaction(function () use ($booking, $actor) {
            $existing = GuestFolio::query()
                ->where('booking_id', $booking->id)
                ->lockForUpdate()
                ->first();

            if ($existing) {
                return $existing;
            }

            $guestId = $booking->guest_id;
            if (! $guestId && $booking->user_id) {
                $guestId = Guest::query()->where('user_id', $booking->user_id)->value('id');
            }

            if (! $guestId) {
                throw ValidationException::withMessages([
                    'booking_id' => ['This booking has no guest profile for folio posting.'],
                ]);
            }

            return GuestFolio::create([
                'folio_number' => 'FOL-'.strtoupper(Str::random(10)),
                'booking_id' => $booking->id,
                'guest_id' => $guestId,
                'resort_id' => $booking->resort_id,
                'status' => 'open',
                'currency' => 'USD',
                'opened_at' => now(),
            ]);
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function summary(Booking $booking, bool $includeAudit = false): array
    {
        $booking->loadMissing(['user', 'resort', 'rooms.roomType', 'rooms.branch', 'payments', 'invoice']);
        $folio = GuestFolio::query()->where('booking_id', $booking->id)->first();
        if (! $folio) {
            $folio = $this->openFolio($booking);
        }

        $folio->load(['charges.postedBy', 'charges.voidedBy']);

        $ledger = $this->ledgerTotals($booking, $folio);

        $payload = [
            'folio' => [
                'id' => $folio->id,
                'folio_number' => $folio->folio_number,
                'status' => $folio->status,
                'currency' => $folio->currency,
                'opened_at' => $folio->opened_at?->toIso8601String(),
                'closed_at' => $folio->closed_at?->toIso8601String(),
            ],
            'booking' => [
                'id' => $booking->id,
                'booking_code' => $booking->booking_code,
                'status' => $booking->status,
                'check_in' => $booking->check_in?->toIso8601String(),
                'check_out' => $booking->check_out?->toIso8601String(),
                'guest' => [
                    'name' => $booking->user?->name,
                    'email' => $booking->user?->email,
                ],
                'resort' => ['id' => $booking->resort_id, 'name' => $booking->resort?->name],
                'rooms' => $booking->rooms->map(fn ($room) => [
                    'id' => $room->id,
                    'room_number' => $room->room_number,
                    'room_type' => $room->roomType?->name,
                    'nights' => (int) ($room->pivot->nights ?? $booking->nights),
                    'price_per_night' => (float) ($room->pivot->price_per_night ?? 0),
                    'subtotal' => (float) ($room->pivot->subtotal ?? 0),
                    'net_subtotal' => (float) ($room->pivot->net_subtotal ?? 0),
                ])->values()->all(),
            ],
            'room_charges' => $this->roomChargeBreakdown($booking),
            'incidental_charges' => $folio->charges->map(fn (FolioCharge $c) => $this->chargePayload($c))->values()->all(),
            'payments' => $this->paymentLines($booking),
            'totals' => $ledger,
            'invoice' => $booking->invoice ? [
                'id' => $booking->invoice->id,
                'invoice_number' => $booking->invoice->invoice_number,
                'status' => $booking->invoice->status,
                'pdf_available' => (bool) $booking->invoice->pdf_path,
            ] : null,
        ];

        if ($includeAudit) {
            $payload['audit'] = ActivityLog::query()
                ->where('model_type', FolioCharge::class)
                ->whereIn('model_id', $folio->charges->pluck('id'))
                ->latest()
                ->limit(50)
                ->get(['id', 'user_id', 'action', 'model_id', 'description', 'changes', 'created_at'])
                ->all();
        }

        return $payload;
    }

    public function postCharge(Booking $booking, array $data, User $actor): FolioCharge
    {
        $this->assertStaffCanManage($booking, $actor);
        $this->assertBookingChargeable($booking);

        $type = (string) ($data['charge_type'] ?? '');
        if (! in_array($type, FolioCharge::INCIDENTAL_TYPES, true)) {
            throw ValidationException::withMessages(['charge_type' => ['Invalid incidental charge type.']]);
        }

        $quantity = round((float) ($data['quantity'] ?? 1), 2);
        $unitPrice = round((float) ($data['unit_price'] ?? 0), 2);
        if ($quantity <= 0) {
            throw ValidationException::withMessages(['quantity' => ['Quantity must be greater than zero.']]);
        }

        $amount = isset($data['amount'])
            ? round((float) $data['amount'], 2)
            : round($quantity * $unitPrice, 2);

        if ($type !== 'discount' && $amount <= 0) {
            throw ValidationException::withMessages(['amount' => ['Charge amount must be greater than zero.']]);
        }
        if ($type === 'discount' && $amount >= 0) {
            $amount = -abs($amount);
        }

        $idempotencyKey = $data['idempotency_key'] ?? null;

        return DB::transaction(function () use ($booking, $data, $actor, $type, $quantity, $unitPrice, $amount, $idempotencyKey) {
            $folio = GuestFolio::query()->where('booking_id', $booking->id)->lockForUpdate()->first();
            if (! $folio) {
                $folio = $this->openFolio($booking, $actor);
                $folio = GuestFolio::query()->whereKey($folio->id)->lockForUpdate()->first();
            }

            $this->assertFolioOpen($folio);

            if ($idempotencyKey) {
                $existing = FolioCharge::query()
                    ->where('idempotency_key', $idempotencyKey)
                    ->first();
                if ($existing) {
                    return $existing;
                }
            }

            $charge = FolioCharge::create([
                'guest_folio_id' => $folio->id,
                'charge_type' => $type,
                'description' => (string) ($data['description'] ?? ucfirst(str_replace('_', ' ', $type))),
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'amount' => $amount,
                'idempotency_key' => $idempotencyKey,
                'posted_by' => $actor->id,
                'posted_at' => now(),
                'note' => $data['note'] ?? null,
            ]);

            $this->audit($actor, 'folio.charge_posted', $charge, [
                'booking_id' => $booking->id,
                'amount' => $amount,
                'charge_type' => $type,
            ]);

            $this->recalculateAndPersistBalance($booking);

            return $charge->fresh(['postedBy']);
        });
    }

    public function voidCharge(FolioCharge $charge, User $actor, string $reason): FolioCharge
    {
        if ($charge->isVoided()) {
            throw ValidationException::withMessages(['charge' => ['This charge is already voided.']]);
        }

        $reason = trim($reason);
        if ($reason === '') {
            throw ValidationException::withMessages(['void_reason' => ['A void reason is required.']]);
        }

        $charge->loadMissing('folio.booking');
        $booking = $charge->folio?->booking;
        if (! $booking) {
            throw ValidationException::withMessages(['charge' => ['Charge is not linked to a booking.']]);
        }

        $this->assertStaffCanManage($booking, $actor);
        $this->assertFolioOpen($charge->folio);

        return DB::transaction(function () use ($charge, $actor, $reason, $booking) {
            $locked = FolioCharge::query()->whereKey($charge->id)->lockForUpdate()->firstOrFail();
            if ($locked->isVoided()) {
                return $locked;
            }

            $locked->update([
                'voided_at' => now(),
                'voided_by' => $actor->id,
                'void_reason' => $reason,
            ]);

            $this->audit($actor, 'folio.charge_voided', $locked, [
                'booking_id' => $booking->id,
                'void_reason' => $reason,
            ]);

            $this->recalculateAndPersistBalance($booking);

            return $locked->fresh(['voidedBy']);
        });
    }

    public function settle(Booking $booking, User $actor): GuestFolio
    {
        $this->assertStaffCanManage($booking, $actor);

        return DB::transaction(function () use ($booking, $actor) {
            $folio = GuestFolio::query()->where('booking_id', $booking->id)->lockForUpdate()->first();
            if (! $folio) {
                $folio = $this->openFolio($booking, $actor);
            }

            $ledger = $this->ledgerTotals($booking, $folio);
            if ($ledger['balance_due'] > 0.009) {
                throw ValidationException::withMessages([
                    'balance' => ['Cannot settle folio while an outstanding balance remains.'],
                ]);
            }

            $folio->update([
                'status' => 'closed',
                'closed_at' => now(),
            ]);

            $this->audit($actor, 'folio.settled', $folio, ['booking_id' => $booking->id]);

            return $folio->fresh();
        });
    }

    public function importFoodOrderCharge(FoodOrder $order, Booking $booking): ?FolioCharge
    {
        if (! in_array($booking->status, GuestFolio::CHARGEABLE_BOOKING_STATUSES, true)) {
            return null;
        }

        return DB::transaction(function () use ($order, $booking) {
            $folio = $this->openFolio($booking);

            $existing = FolioCharge::query()
                ->where('idempotency_key', 'food_order_'.$order->id)
                ->first();
            if ($existing) {
                return $existing;
            }

            $charge = FolioCharge::create([
                'guest_folio_id' => $folio->id,
                'charge_type' => 'restaurant',
                'description' => 'Room service / dining — '.$order->order_code,
                'quantity' => 1,
                'unit_price' => (float) $order->total,
                'amount' => (float) $order->total,
                'reference_type' => FoodOrder::class,
                'reference_id' => $order->id,
                'idempotency_key' => 'food_order_'.$order->id,
                'posted_at' => now(),
                'note' => $order->note,
            ]);

            $this->recalculateAndPersistBalance($booking);

            return $charge;
        });
    }

    public function outstandingBalance(Booking $booking): float
    {
        return $this->ledgerFor($booking)['balance_due'];
    }

    /**
     * @return array<string, float>
     */
    public function ledgerFor(Booking $booking): array
    {
        $folio = GuestFolio::query()->where('booking_id', $booking->id)->first();
        if (! $folio) {
            $folio = $this->openFolio($booking);
        }

        return $this->ledgerTotals($booking, $folio);
    }

    public function recalculateAndPersistBalance(Booking $booking): Booking
    {
        $folio = GuestFolio::query()->where('booking_id', $booking->id)->first();
        if (! $folio) {
            $folio = $this->openFolio($booking);
        }

        $ledger = $this->ledgerTotals($booking, $folio);
        $booking->forceFill([
            'balance_due' => $ledger['balance_due'],
            'deposit_amount' => $ledger['net_paid'],
        ])->save();

        return $booking->fresh();
    }

    public function generateConsolidatedInvoice(Booking $booking, User $actor): Invoice
    {
        $this->assertStaffCanManage($booking, $actor);

        $booking->loadMissing('invoice', 'payments');
        $summary = $this->summary($booking);
        $totals = $summary['totals'];

        $invoice = Invoice::updateOrCreate(
            ['booking_id' => $booking->id],
            [
                'invoice_number' => 'INV-'.($booking->booking_code ?? $booking->id),
                'amount' => $totals['lodging_subtotal'],
                'discount' => $totals['lodging_discount'],
                'tax' => $totals['lodging_tax'],
                'service_charge' => $totals['lodging_service'],
                'total' => $totals['charges_total'],
                'status' => $totals['balance_due'] <= 0.009 ? 'paid' : 'issued',
                'issued_at' => $booking->invoice?->issued_at ?? now(),
                'due_at' => $booking->invoice?->due_at ?? now()->addDays(7),
            ]
        );

        $this->receipts->generateFolioConsolidatedPdf($invoice, $booking, $summary);

        return $invoice->fresh();
    }

    public function assertGuestCanView(Booking $booking, User $user): void
    {
        $this->bookings->assertAccessible($booking, $user);

        if (! in_array($booking->status, GuestFolio::VIEWABLE_BOOKING_STATUSES, true)) {
            abort(403, 'Folio is not available for this booking status.');
        }
    }

    protected function assertStaffCanManage(Booking $booking, User $actor): void
    {
        if ($actor->isGuestAccount()) {
            abort(403, 'Guests cannot modify folio charges.');
        }
        $this->bookings->assertAccessible($booking, $actor);
    }

    protected function assertBookingChargeable(Booking $booking): void
    {
        if (! in_array($booking->status, GuestFolio::CHARGEABLE_BOOKING_STATUSES, true)) {
            throw ValidationException::withMessages([
                'status' => ['Charges can only be posted to confirmed or in-house bookings.'],
            ]);
        }
    }

    protected function assertFolioOpen(GuestFolio $folio): void
    {
        if (! $folio->isOpen()) {
            throw ValidationException::withMessages([
                'folio' => ['This folio is closed and cannot accept changes.'],
            ]);
        }
    }

    /**
     * @return array<string, float>
     */
    protected function ledgerTotals(Booking $booking, GuestFolio $folio): array
    {
        $lodgingSubtotal = (float) $booking->subtotal;
        $lodgingDiscount = (float) $booking->discount;
        $lodgingTax = (float) ($booking->tax_amount ?? 0);
        $lodgingService = (float) ($booking->service_charge_amount ?? 0);
        $lodgingTotal = (float) $booking->total_amount;
        if ($lodgingTotal <= 0) {
            $lodgingTotal = max(0, $lodgingSubtotal - $lodgingDiscount + $lodgingTax + $lodgingService);
        }

        $incidentals = (float) FolioCharge::query()
            ->where('guest_folio_id', $folio->id)
            ->whereNull('voided_at')
            ->sum('amount');

        $chargesTotal = round($lodgingTotal + $incidentals, 2);

        $paid = (float) Payment::query()
            ->where('booking_id', $booking->id)
            ->where('status', 'paid')
            ->sum('paid_amount');

        $refunded = (float) Payment::query()
            ->where('booking_id', $booking->id)
            ->where('status', 'refunded')
            ->sum('refund_amount');

        $netPaid = max(0, round($paid - $refunded, 2));
        $balanceDue = round(max(0, $chargesTotal - $netPaid), 2);

        return [
            'lodging_subtotal' => round($lodgingSubtotal, 2),
            'lodging_discount' => round($lodgingDiscount, 2),
            'lodging_tax' => round($lodgingTax, 2),
            'lodging_service' => round($lodgingService, 2),
            'lodging_total' => round($lodgingTotal, 2),
            'incidentals_total' => round($incidentals, 2),
            'charges_total' => $chargesTotal,
            'paid_total' => round($paid, 2),
            'refunded_total' => round($refunded, 2),
            'net_paid' => $netPaid,
            'balance_due' => $balanceDue,
            'credits_total' => round((float) FolioCharge::query()
                ->where('guest_folio_id', $folio->id)
                ->whereNull('voided_at')
                ->where('amount', '<', 0)
                ->sum('amount'), 2),
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    protected function roomChargeBreakdown(Booking $booking): array
    {
        $lines = [];
        foreach ($booking->rooms as $room) {
            $lines[] = [
                'type' => 'room',
                'description' => 'Room '.$room->room_number.' — '.($room->roomType?->name ?? 'Room'),
                'quantity' => (float) ($room->pivot->nights ?? $booking->nights),
                'unit_price' => (float) ($room->pivot->price_per_night ?? 0),
                'amount' => (float) ($room->pivot->net_subtotal ?? $room->pivot->subtotal ?? 0),
            ];
        }

        if ($booking->tax_amount > 0) {
            $lines[] = [
                'type' => 'tax',
                'description' => 'Tax',
                'quantity' => 1,
                'unit_price' => (float) $booking->tax_amount,
                'amount' => (float) $booking->tax_amount,
            ];
        }

        if ($booking->service_charge_amount > 0) {
            $lines[] = [
                'type' => 'service',
                'description' => 'Service charge',
                'quantity' => 1,
                'unit_price' => (float) $booking->service_charge_amount,
                'amount' => (float) $booking->service_charge_amount,
            ];
        }

        return $lines;
    }

    /**
     * @return list<array<string, mixed>>
     */
    protected function paymentLines(Booking $booking): array
    {
        return $booking->payments
            ->sortByDesc('id')
            ->map(fn (Payment $p) => [
                'id' => $p->id,
                'payment_id' => $p->payment_id,
                'source' => $p->source,
                'status' => $p->status,
                'method' => $p->payment_method ?? $p->method,
                'amount' => (float) $p->amount,
                'paid_amount' => (float) $p->paid_amount,
                'refund_amount' => (float) ($p->refund_amount ?? 0),
                'paid_at' => $p->paid_at?->toIso8601String(),
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    protected function chargePayload(FolioCharge $charge): array
    {
        return [
            'id' => $charge->id,
            'charge_type' => $charge->charge_type,
            'description' => $charge->description,
            'quantity' => (float) $charge->quantity,
            'unit_price' => (float) $charge->unit_price,
            'amount' => (float) $charge->amount,
            'posted_at' => $charge->posted_at?->toIso8601String(),
            'posted_by' => $charge->postedBy?->name,
            'voided_at' => $charge->voided_at?->toIso8601String(),
            'voided_by' => $charge->voidedBy?->name,
            'void_reason' => $charge->void_reason,
            'note' => $charge->note,
        ];
    }

    protected function audit(User $actor, string $action, object $model, array $changes = []): void
    {
        ActivityLog::create([
            'user_id' => $actor->id,
            'action' => $action,
            'model_type' => $model::class,
            'model_id' => $model->id,
            'description' => $action,
            'changes' => $changes,
            'ip_address' => request()?->ip() ?? '',
            'user_agent' => request()?->userAgent() ?? '',
        ]);
    }
}
