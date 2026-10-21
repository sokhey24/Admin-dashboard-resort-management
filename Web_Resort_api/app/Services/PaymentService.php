<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\FoodOrder;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\PaymentTransaction;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class PaymentService
{
    public const STATUSES = ['pending', 'paid', 'failed', 'refunded'];

    public const METHODS = ['cash', 'credit_card', 'bank_transfer', 'qr_code', 'online'];

    public const METHOD_MAP = [
        'cash' => 'cash',
        'credit_card' => 'credit_card',
        'debit_card' => 'credit_card',
        'bank_transfer' => 'bank_transfer',
        'qr_code' => 'qr_code',
        'online' => 'online',
    ];

    public function __construct(
        protected PaymentReceiptService $receipts,
        protected BakongKhqrService $khqr,
        protected ResortAccessService $resortAccess,
        protected BranchAccessService $branchAccess,
    ) {}

    public function paginateResort(array $filters, User $user): LengthAwarePaginator
    {
        $filters['source'] = $filters['source'] ?? 'resort';

        return $this->paginate($filters, $user);
    }

    public function paginate(array $filters, User $user): LengthAwarePaginator
    {
        $source = $filters['source'] ?? 'resort';
        $query = Payment::query()->with(['guest', 'transactions']);

        if ($source === 'restaurant') {
            $query->where('source', 'restaurant')
                ->with(['reference']);
            $this->applyRestaurantScope($query, $user, $filters);
        } elseif ($source === 'all') {
            $query->with([
                'booking.resort',
                'booking.rooms.roomType',
                'booking.rooms.branch',
                'reference',
            ]);
            $this->applyCombinedScope($query, $user, $filters);
        } else {
            $query->with(['booking.resort', 'booking.rooms.roomType', 'booking.rooms.branch'])
                ->where(function ($q) {
                    $q->where('source', 'resort')
                        ->orWhere(function ($legacy) {
                            $legacy->whereNull('source')->whereNotNull('booking_id');
                        });
                });
            $this->applyResortScope($query, $user, $filters);
        }

        $this->applyListFilters($query, $filters, $source);

        $perPage = min(50, max(1, (int) ($filters['per_page'] ?? 10)));

        return $query->latest()->paginate($perPage);
    }

    public function stats(array $filters, User $user): array
    {
        $source = $filters['source'] ?? 'resort';
        $query = Payment::query();

        if ($source === 'restaurant') {
            $query->where('source', 'restaurant');
            $this->applyRestaurantScope($query, $user, $filters);
        } elseif ($source === 'all') {
            $this->applyCombinedScope($query, $user, $filters);
        } else {
            $query->where(function ($q) {
                $q->where('source', 'resort')
                    ->orWhere(function ($legacy) {
                        $legacy->whereNull('source')->whereNotNull('booking_id');
                    });
            });
            $this->applyResortScope($query, $user, $filters);
        }

        $this->applyListFilters($query, $filters, $source, false);

        $paid = (clone $query)->where('status', 'paid')->sum('paid_amount');
        $pending = (clone $query)->where('status', 'pending')->sum('amount');
        $refunded = (clone $query)->where('status', 'refunded')->sum('refund_amount');

        $outstanding = 0.0;
        if ($source !== 'restaurant') {
            $bookingQ = Booking::query();
            $this->applyBookingResortScope($bookingQ, $user, $filters['resort_id'] ?? null);
            $this->branchAccess->applyBookingBranchScope($bookingQ, $user, $filters['branch_id'] ?? null);
            $outstanding = round((float) $bookingQ->sum('balance_due'), 2);
        }

        return [
            'collected' => round((float) $paid, 2),
            'pending' => round((float) $pending, 2),
            'refunded' => round((float) $refunded, 2),
            'paid_count' => (clone $query)->where('status', 'paid')->count(),
            'pending_count' => (clone $query)->where('status', 'pending')->count(),
            'refunded_count' => (clone $query)->where('status', 'refunded')->count(),
            'outstanding' => $outstanding,
        ];
    }

    public function assertAccessible(Payment $payment, User $user): void
    {
        if ($this->resortAccess->bypassesResortScope($user)) {
            return;
        }

        if ($user->isGuestAccount()) {
            if ((int) $payment->user_id !== (int) $user->id) {
                abort(403, 'You cannot access this payment.');
            }

            return;
        }

        $assigned = $user->resorts()->pluck('resorts.id');

        if ($payment->source === 'restaurant') {
            $payment->loadMissing('reference.restaurantTable', 'reference.branch');
            /** @var FoodOrder|null $order */
            $order = $payment->reference;
            if (! $order) {
                abort(403, 'You cannot access payments for this restaurant.');
            }

            $branchId = (int) ($order->branch_id ?? $order->restaurantTable?->branch_id ?? 0);
            if ($branchId && ! $this->branchAccess->bypassesBranchScope($user)) {
                $assignedBranches = $this->branchAccess->assignedBranchIds($user);
                if ($assignedBranches === [] || ! in_array($branchId, $assignedBranches, true)) {
                    abort(403, 'You cannot access payments for this restaurant branch.');
                }

                return;
            }

            $resortId = (int) ($order->restaurantTable?->resort_id ?? 0);
            if ($resortId && ! $assigned->contains($resortId)) {
                abort(403, 'You cannot access payments for this restaurant.');
            }

            return;
        }

        $payment->loadMissing('booking');
        if (! $assigned->contains((int) $payment->booking?->resort_id)) {
            abort(403, 'You cannot access payments for this resort.');
        }
    }

    public function createResortPayment(array $input, User $actor): Payment
    {
        $booking = Booking::with(['rooms', 'payments'])->find($input['booking_id'] ?? $input['reference_id'] ?? null);
        if (! $booking) {
            throw ValidationException::withMessages(['booking_id' => ['Booking not found.']]);
        }
        $this->assertBookingPayable($booking, $actor);

        $methodKey = $input['payment_method'] ?? $input['method'] ?? 'cash';
        $method = self::METHOD_MAP[$methodKey] ?? null;
        if (! $method) {
            throw ValidationException::withMessages(['payment_method' => ['Unsupported payment method.']]);
        }

        $totals = $this->bookingTotals($booking);
        $remaining = app(FolioService::class)->outstandingBalance($booking);
        if ($remaining <= 0) {
            throw ValidationException::withMessages(['amount' => ['This booking is already fully paid.']]);
        }

        $requested = isset($input['amount']) ? (float) $input['amount'] : $remaining;
        if ($requested <= 0) {
            throw ValidationException::withMessages(['amount' => ['Payment amount must be greater than zero.']]);
        }
        if ($requested > $remaining + 0.009) {
            throw ValidationException::withMessages(['amount' => ['Payment exceeds remaining balance of '.$remaining.'.']]);
        }

        $status = $input['status'] ?? 'paid';
        if (! in_array($status, self::STATUSES, true)) {
            throw ValidationException::withMessages(['status' => ['Invalid payment status.']]);
        }

        $paidAmount = $status === 'paid' ? $requested : 0.0;
        $chargesTotal = app(FolioService::class)->ledgerFor($booking)['charges_total'];
        $ratio = $chargesTotal > 0 ? ($requested / $chargesTotal) : 1;

        return DB::transaction(function () use ($booking, $actor, $method, $methodKey, $totals, $requested, $status, $paidAmount, $ratio, $input) {
            $payment = Payment::create([
                'booking_id' => $booking->id,
                'user_id' => $booking->user_id,
                'source' => 'resort',
                'reference_type' => Booking::class,
                'reference_id' => $booking->id,
                'amount' => $requested,
                'method' => $method,
                'payment_method' => $methodKey,
                'gateway' => $input['gateway'] ?? null,
                'payment_reference' => $input['payment_reference'] ?? null,
                'currency' => $input['currency'] ?? 'USD',
                'subtotal' => round($totals['subtotal'] * $ratio, 2),
                'discount' => round($totals['discount'] * $ratio, 2),
                'tax' => round($totals['tax'] * $ratio, 2),
                'service_charge' => round($totals['service'] * $ratio, 2),
                'paid_amount' => $paidAmount,
                'balance' => round($requested - $paidAmount, 2),
                'status' => $status,
                'paid_at' => $status === 'paid' ? now() : null,
                'note' => $input['note'] ?? null,
                'created_by' => $actor->id,
                'transaction_ref' => $input['transaction_ref'] ?? ('TXN-'.strtoupper(uniqid())),
            ]);

            PaymentTransaction::create([
                'payment_id' => $payment->id,
                'gateway' => $payment->gateway,
                'gateway_ref' => $payment->transaction_ref,
                'amount' => $requested,
                'status' => $status === 'failed' ? 'failed' : ($status === 'paid' ? 'success' : 'pending'),
                'response_data' => ['type' => 'charge', 'booking_id' => $booking->id],
            ]);

            $fresh = $booking->fresh(['payments', 'invoice']);
            $this->syncBookingBalance($fresh);
            $fresh->refresh();
            $this->upsertInvoice($fresh, $payment, $totals);

            if ($status === 'paid') {
                $bookingId = (int) $booking->id;
                $paymentId = (int) $payment->id;
                DB::afterCommit(function () use ($bookingId, $paymentId) {
                    event(new \App\Events\BookingPaid($bookingId, $paymentId));
                });
            }

            return $payment->fresh(['guest', 'booking.rooms.roomType', 'booking.invoice', 'transactions']);
        });
    }

    public function refund(Payment $payment, float $amount, User $actor, ?string $reason = null): Payment
    {
        if ($payment->status !== 'paid') {
            throw ValidationException::withMessages(['status' => ['Only paid payments can be refunded.']]);
        }
        $max = (float) $payment->paid_amount;
        if ($amount <= 0 || $amount > $max + 0.009) {
            throw ValidationException::withMessages(['refund_amount' => ['Refund amount must be between 0.01 and '.$max.'.']]);
        }

        return DB::transaction(function () use ($payment, $amount, $actor, $reason) {
            $payment->update([
                'status' => 'refunded',
                'refund_amount' => $amount,
                'refunded_at' => now(),
                'note' => $reason,
                'updated_by' => $actor->id,
                'balance' => round(((float) $payment->amount) - ((float) $payment->paid_amount) + $amount, 2),
            ]);

            PaymentTransaction::create([
                'payment_id' => $payment->id,
                'gateway' => $payment->gateway,
                'gateway_ref' => 'REFUND-'.$payment->payment_id,
                'amount' => $amount,
                'status' => 'success',
                'response_data' => ['type' => 'refund', 'reason' => $reason],
            ]);

            if ($payment->booking_id) {
                $this->syncBookingBalance($payment->booking()->with('payments')->first());
            }

            return $payment->fresh(['guest', 'booking.rooms.roomType', 'transactions']);
        });
    }

    public function bookingTotals(Booking $booking): array
    {
        $subtotal = (float) $booking->subtotal;
        $discount = (float) $booking->discount;
        $roomDiscount = (float) ($booking->room_discount_total ?? 0);
        // Whatever the room percentages did not account for came from a coupon.
        $couponDiscount = max(0, round($discount - $roomDiscount, 2));
        $tax = (float) ($booking->tax_amount ?? 0);
        $service = (float) ($booking->service_charge_amount ?? 0);
        $total = (float) $booking->total_amount;
        if ($total <= 0) {
            $total = max(0, $subtotal - $discount + $tax + $service);
        }

        return compact('subtotal', 'discount', 'roomDiscount', 'couponDiscount', 'tax', 'service', 'total');
    }

    public function assertBookingPayable(Booking $booking, User $actor): void
    {
        if (in_array($booking->status, ['cancelled'], true)) {
            throw ValidationException::withMessages(['booking_id' => ['Cannot take payment for a cancelled booking.']]);
        }

        if ($actor->isGuestAccount()) {
            if ((int) $booking->user_id !== (int) $actor->id) {
                throw ValidationException::withMessages(['booking_id' => ['You cannot pay for this booking.']]);
            }

            return;
        }

        if (! $this->resortAccess->bypassesResortScope($actor)) {
            $assigned = $actor->assignedResortIds();
            if ($assigned === [] || ! in_array((int) $booking->resort_id, $assigned, true)) {
                throw ValidationException::withMessages(['booking_id' => ['This booking does not belong to your resort.']]);
            }
        }
    }

    /**
     * Create a pending KHQR payment for the booking's remaining balance (never from the client).
     */
    public function initiateKhqr(Booking $booking, User $actor, string $gateway = 'aba-khqr'): Payment
    {
        $booking = Booking::with(['rooms', 'payments'])->findOrFail($booking->id);
        $this->assertBookingPayable($booking, $actor);

        $totals = $this->bookingTotals($booking);
        $remaining = app(FolioService::class)->outstandingBalance($booking);
        if ($remaining <= 0) {
            throw ValidationException::withMessages(['amount' => ['This booking is already fully paid.']]);
        }

        $methodKey = self::METHOD_MAP[$gateway] ?? 'qr_code';
        $reusable = Payment::query()
            ->where('booking_id', $booking->id)
            ->where('status', 'pending')
            ->where('method', $methodKey)
            ->where('payment_method', $gateway)
            ->whereNotNull('khqr_md5')
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->latest('id')
            ->first();
        if ($reusable) {
            Log::info('KHQR initiate: reusing pending QR', [
                'payment_id' => $reusable->id,
                'booking_id' => $booking->id,
            ]);

            return $reusable->fresh(['guest', 'booking.rooms.roomType', 'transactions']);
        }

        $qr = $this->khqr->generate($remaining);
        $ttl = (int) config('services.bakong.qr_ttl_seconds', 300);
        $chargesTotal = app(FolioService::class)->ledgerFor($booking)['charges_total'];
        $ratio = $chargesTotal > 0 ? ($remaining / $chargesTotal) : 1;

        return DB::transaction(function () use ($booking, $actor, $gateway, $totals, $remaining, $qr, $ttl, $ratio) {
            $payment = Payment::create([
                'booking_id' => $booking->id,
                'user_id' => $booking->user_id,
                'source' => 'resort',
                'reference_type' => Booking::class,
                'reference_id' => $booking->id,
                'amount' => $remaining,
                'method' => 'qr_code',
                'payment_method' => $gateway,
                'gateway' => 'bakong',
                'currency' => strtoupper((string) config('services.bakong.currency', 'USD')),
                'subtotal' => round($totals['subtotal'] * $ratio, 2),
                'discount' => round($totals['discount'] * $ratio, 2),
                'tax' => round($totals['tax'] * $ratio, 2),
                'service_charge' => round($totals['service'] * $ratio, 2),
                'paid_amount' => 0,
                'balance' => $remaining,
                'status' => 'pending',
                'khqr_md5' => $qr['md5'],
                'qr_payload' => $qr['qr'],
                'expires_at' => now()->addSeconds($ttl),
                'created_by' => $actor->id,
                'transaction_ref' => 'KHQR-'.strtoupper(uniqid()),
            ]);

            PaymentTransaction::create([
                'payment_id' => $payment->id,
                'gateway' => 'bakong',
                'gateway_ref' => $payment->khqr_md5,
                'amount' => $remaining,
                'status' => 'pending',
                'response_data' => ['type' => 'khqr_init', 'booking_id' => $booking->id],
            ]);

            return $payment->fresh(['guest', 'booking.rooms.roomType', 'transactions']);
        });
    }

    public function initiateFoodOrderKhqr(FoodOrder $order, User $actor, string $gateway = 'aba-khqr'): Payment
    {
        $order = FoodOrder::with('orderItems')->findOrFail($order->id);
        if ((int) $order->user_id !== (int) $actor->id) {
            abort(403, 'You cannot pay for this order.');
        }

        $amount = (float) $order->total;
        if ($amount <= 0) {
            throw ValidationException::withMessages(['amount' => ['Order total must be greater than zero.']]);
        }

        $reusable = Payment::query()
            ->where('reference_type', FoodOrder::class)
            ->where('reference_id', $order->id)
            ->where('status', 'pending')
            ->where('method', 'qr_code')
            ->whereNotNull('khqr_md5')
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->latest('id')
            ->first();
        if ($reusable) {
            return $reusable->fresh(['guest', 'reference', 'transactions']);
        }

        $qr = $this->khqr->generate($amount);
        $ttl = (int) config('services.bakong.qr_ttl_seconds', 300);

        return DB::transaction(function () use ($order, $actor, $gateway, $amount, $qr, $ttl) {
            $payment = Payment::create([
                'booking_id' => $order->booking_id,
                'user_id' => $order->user_id,
                'source' => 'restaurant',
                'reference_type' => FoodOrder::class,
                'reference_id' => $order->id,
                'amount' => $amount,
                'method' => 'qr_code',
                'payment_method' => $gateway,
                'gateway' => 'bakong',
                'currency' => strtoupper((string) config('services.bakong.currency', 'USD')),
                'subtotal' => $order->subtotal,
                'tax' => $order->tax,
                'service_charge' => $order->service_charge ?? 0,
                'paid_amount' => 0,
                'balance' => $amount,
                'status' => 'pending',
                'khqr_md5' => $qr['md5'],
                'qr_payload' => $qr['qr'],
                'expires_at' => now()->addSeconds($ttl),
                'created_by' => $actor->id,
                'transaction_ref' => 'KHQR-FO-'.strtoupper(uniqid()),
            ]);

            PaymentTransaction::create([
                'payment_id' => $payment->id,
                'gateway' => 'bakong',
                'gateway_ref' => $payment->khqr_md5,
                'amount' => $amount,
                'status' => 'pending',
                'response_data' => ['type' => 'khqr_init', 'food_order_id' => $order->id],
            ]);

            return $payment->fresh(['guest', 'reference', 'transactions']);
        });
    }

    /**
     * Poll Bakong and settle a pending KHQR payment into the RMS ledger.
     *
     * @return array{status: string, message: string, paid: bool, payment?: Payment}
     */
    public function verifyKhqr(Payment $payment, User $actor): array
    {
        $this->assertAccessible($payment, $actor);

        if ($payment->status === 'paid') {
            return [
                'status' => 'paid',
                'message' => 'Payment already confirmed.',
                'paid' => true,
                'payment' => $payment->load(['booking.invoice', 'transactions']),
            ];
        }

        $awaitingKhqr = $payment->khqr_md5 && in_array($payment->status, ['pending', 'failed'], true)
            && ($payment->status === 'pending' || $payment->note === 'KHQR expired');

        if (! $awaitingKhqr) {
            throw ValidationException::withMessages(['payment' => ['This payment is not awaiting KHQR settlement.']]);
        }

        // Always ask Bakong before treating the QR as expired — guests often pay as the UI timer hits zero.
        $check = $this->khqr->checkByMd5($payment->khqr_md5);
        $logContext = [
            'payment_id' => $payment->id,
            'booking_id' => $payment->booking_id,
            'expected_amount' => (float) $payment->amount,
            'currency' => $payment->currency,
            'payment_status' => $payment->status,
            'expires_at' => $payment->expires_at?->toIso8601String(),
            'bakong_state' => $check['state'] ?? null,
        ];

        if ($check['state'] !== 'paid') {
            if ($check['state'] === 'api_error') {
                Log::warning('KHQR verify: Bakong unavailable', $logContext);

                return [
                    'status' => 'api_error',
                    'message' => $check['message'],
                    'paid' => false,
                ];
            }

            if ($payment->expires_at && $payment->expires_at->isPast()) {
                $graceEnds = $payment->expires_at->copy()->addSeconds($this->khqrVerifyGraceSeconds());
                if ($graceEnds->isFuture()) {
                    Log::info('KHQR verify: QR TTL passed, still within verification grace', $logContext);

                    return [
                        'status' => 'pending',
                        'message' => 'Still checking for your payment…',
                        'paid' => false,
                    ];
                }

                if ($payment->status !== 'failed') {
                    $payment->update(['status' => 'failed', 'note' => 'KHQR expired']);
                }
                Log::info('KHQR verify: expired with no Bakong settlement', $logContext);

                return ['status' => 'expired', 'message' => 'This QR has expired. Please generate a new one.', 'paid' => false];
            }

            Log::debug('KHQR verify: awaiting Bakong settlement', $logContext);

            return [
                'status' => 'pending',
                'message' => $check['message'],
                'paid' => false,
            ];
        }

        $data = $check['data'] ?? [];
        if (! $this->khqr->transactionMatches((float) $payment->amount, (string) $payment->currency, $data)) {
            Log::warning('KHQR verify: Bakong amount mismatch', array_merge($logContext, [
                'bakong_amount' => $data['amount'] ?? null,
                'bakong_currency' => $data['currency'] ?? null,
                'bakong_hash' => $data['hash'] ?? null,
            ]));
            $payment->update(['status' => 'failed', 'note' => 'Bakong amount mismatch']);

            return ['status' => 'failed', 'message' => 'The paid amount did not match this booking.', 'paid' => false];
        }

        $settled = $this->settleResortPaymentRecord($payment, [
            'gateway' => 'bakong',
            'gateway_ref' => $data['hash'] ?? $payment->khqr_md5,
            'payment_reference' => $data['hash'] ?? $payment->khqr_md5,
            'bakong_hash' => $data['hash'] ?? null,
            'response_data' => ['type' => 'khqr_settled', 'bakong' => $data],
        ]);

        $settledPayment = $settled['payment'];
        $newlySettled = (bool) ($settled['newly_settled'] ?? false);

        if ($newlySettled && $settledPayment->booking_id) {
            event(new \App\Events\BookingPaid((int) $settledPayment->booking_id, (int) $settledPayment->id));
        }

        Log::info('KHQR verify: payment settled', [
            'payment_id' => $settledPayment->id,
            'booking_id' => $settledPayment->booking_id,
            'expected_amount' => (float) $settledPayment->amount,
            'bakong_hash' => $data['hash'] ?? null,
        ]);

        return [
            'status' => 'paid',
            'message' => 'Payment confirmed.',
            'paid' => true,
            'payment' => $settledPayment,
        ];
    }

    protected function khqrVerifyGraceSeconds(): int
    {
        return max(0, (int) config('services.bakong.verify_grace_seconds', 180));
    }

    /**
     * Idempotent resort booking settlement (KHQR, Stripe, staff cash, etc.).
     *
     * @param  array{gateway: string, gateway_ref: string, response_data: array, payment_reference?: ?string, card_last4?: ?string, card_brand?: ?string, bakong_hash?: ?string}  $meta
     * @return array{payment: Payment, newly_settled: bool}
     */
    public function settleResortPaymentRecord(Payment $payment, array $meta): array
    {
        return DB::transaction(function () use ($payment, $meta) {
            $locked = Payment::whereKey($payment->id)->lockForUpdate()->firstOrFail();
            if ($locked->status === 'paid') {
                return [
                    'payment' => $locked->fresh(['guest', 'booking.invoice', 'booking.rooms.roomType', 'transactions']),
                    'newly_settled' => false,
                ];
            }

            $patch = [
                'status' => 'paid',
                'paid_amount' => $locked->amount,
                'balance' => 0,
                'paid_at' => now(),
            ];
            if (! empty($meta['payment_reference'])) {
                $patch['payment_reference'] = $meta['payment_reference'];
            }
            if (! empty($meta['bakong_hash'])) {
                $patch['bakong_hash'] = $meta['bakong_hash'];
            }
            if (! empty($meta['card_last4'])) {
                $patch['card_last4'] = $meta['card_last4'];
            }
            if (! empty($meta['card_brand'])) {
                $patch['card_brand'] = $meta['card_brand'];
            }

            $locked->update($patch);

            PaymentTransaction::create([
                'payment_id' => $locked->id,
                'gateway' => $meta['gateway'],
                'gateway_ref' => $meta['gateway_ref'],
                'amount' => $locked->amount,
                'status' => 'success',
                'response_data' => $meta['response_data'],
            ]);

            $booking = Booking::with(['payments', 'invoice', 'rooms'])->find($locked->booking_id);
            if ($booking) {
                $this->syncBookingBalance($booking);
                $booking->refresh();
                $this->upsertInvoice($booking, $locked->fresh(), $this->bookingTotals($booking));
            }

            return [
                'payment' => $locked->fresh(['guest', 'booking.invoice', 'booking.rooms.roomType', 'transactions']),
                'newly_settled' => true,
            ];
        });
    }

    protected function applyListFilters($query, array $filters, string $source, bool $includeStatus = true): void
    {
        if ($includeStatus && ! empty($filters['status']) && $filters['status'] !== 'all') {
            $query->where('status', $filters['status']);
        }
        if (! empty($filters['payment_method'])) {
            $method = $filters['payment_method'];
            $query->where(function ($q) use ($method) {
                $q->where('payment_method', $method)->orWhere('method', $method);
            });
        }
        if (! empty($filters['booking_id']) && $source !== 'restaurant') {
            $query->where('booking_id', $filters['booking_id']);
        }
        $search = trim((string) ($filters['search'] ?? ''));
        if ($search !== '') {
            $like = '%'.$search.'%';
            $query->where(function ($q) use ($like, $search, $source) {
                $q->where('payment_id', 'like', $like)
                    ->orWhere('payment_reference', 'like', $like)
                    ->orWhere('transaction_ref', 'like', $like)
                    ->orWhereHas('guest', fn ($g) => $g->where('name', 'like', $like)->orWhere('email', 'like', $like))
                    ->orWhereHas('transactions', fn ($t) => $t->where('gateway_ref', 'like', $like));
                if ($source !== 'restaurant') {
                    $q->orWhereHas('booking', fn ($b) => $b->where('booking_code', 'like', $like));
                }
                if ($source !== 'resort') {
                    $q->orWhereHasMorph('reference', [FoodOrder::class], fn ($o) => $o->where('order_code', 'like', $like));
                }
                if (ctype_digit($search)) {
                    $id = (int) $search;
                    $q->orWhere('id', $id)->orWhere('booking_id', $id);
                }
            });
        }

        if (! empty($filters['date'])) {
            $query->whereDate('created_at', $filters['date']);
        } elseif (! empty($filters['month'])) {
            $query->whereMonth('created_at', $filters['month'])
                ->whereYear('created_at', $filters['year'] ?? now()->year);
        } elseif (! empty($filters['year'])) {
            $query->whereYear('created_at', $filters['year']);
        }
        if (! empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }
        if (! empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }
    }

    protected function applyRestaurantScope($query, User $user, array $filters): void
    {
        $resortId = $filters['resort_id'] ?? null;
        $branchId = $filters['branch_id'] ?? null;

        $query->whereHasMorph('reference', [FoodOrder::class], function ($q) use ($user, $resortId, $branchId) {
            $this->branchAccess->applyFoodOrderBranchScope($q, $user, $branchId);
            $q->whereHas('restaurantTable', function ($t) use ($user, $resortId) {
                $this->resortAccess->applyResortColumnScope($t, $user, 'resort_id', $resortId);
            });
        });
    }

    protected function applyCombinedScope($query, User $user, array $filters): void
    {
        $query->where(function ($outer) use ($user, $filters) {
            $outer->where(function ($resortQ) use ($user, $filters) {
                $resortQ->where(function ($s) {
                    $s->where('source', 'resort')
                        ->orWhere(function ($legacy) {
                            $legacy->whereNull('source')->whereNotNull('booking_id');
                        });
                });
                $this->applyResortScope($resortQ, $user, $filters);
            })->orWhere(function ($restQ) use ($user, $filters) {
                $restQ->where('source', 'restaurant');
                $this->applyRestaurantScope($restQ, $user, $filters);
            });
        });
    }

    protected function applyResortScope($query, User $user, array $filters): void
    {
        $resortId = $filters['resort_id'] ?? null;
        $branchId = $filters['branch_id'] ?? null;

        $query->whereHas('booking', function ($b) use ($user, $resortId, $branchId) {
            $this->resortAccess->applyResortColumnScope($b, $user, 'resort_id', $resortId);
            $this->branchAccess->applyBookingBranchScope($b, $user, $branchId);
        });
    }

    protected function applyBookingResortScope($query, User $user, mixed $resortId, ?string $relation = null): void
    {
        $constrain = function ($q) use ($user, $resortId) {
            $this->resortAccess->applyResortColumnScope($q, $user, 'resort_id', $resortId);
        };

        if ($relation) {
            $query->whereHas($relation, $constrain);

            return;
        }

        $constrain($query);
    }

    protected function upsertInvoice(Booking $booking, Payment $payment, array $totals): void
    {
        $paidFully = (float) $booking->balance_due <= 0.009;
        $payload = [
            'payment_id' => $payment->id,
            'invoice_number' => 'INV-'.($booking->booking_code ?? $booking->id),
            'amount' => $totals['subtotal'],
            'discount' => $totals['discount'],
            'tax' => $totals['tax'],
            'service_charge' => $totals['service'],
            'total' => $totals['total'],
            'status' => $paidFully ? 'paid' : 'issued',
            'issued_at' => $booking->invoice?->issued_at ?? now(),
            'due_at' => $booking->invoice?->due_at ?? now()->addDays(7),
        ];
        if ($booking->invoice) {
            $booking->invoice->update($payload);

            return;
        }
        Invoice::create(array_merge($payload, ['booking_id' => $booking->id]));
    }

    protected function syncBookingBalance(?Booking $booking): void
    {
        if (! $booking) {
            return;
        }
        app(FolioService::class)->recalculateAndPersistBalance($booking);
    }
}
