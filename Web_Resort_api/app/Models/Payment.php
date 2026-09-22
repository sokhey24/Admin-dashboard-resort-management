<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $fillable = [
        'payment_id', 'source', 'reference_type', 'reference_id',
        'booking_id', 'user_id',
        'amount', 'currency', 'method', 'payment_method',
        'gateway', 'payment_reference', 'transaction_ref', 'card_last4',
        'subtotal', 'discount', 'tax', 'service_charge',
        'paid_amount', 'balance', 'refund_amount',
        'status', 'paid_at', 'refunded_at', 'note',
        'khqr_md5', 'qr_payload', 'bakong_hash', 'expires_at',
        'created_by', 'updated_by',
    ];

    protected $casts = [
        'paid_at'        => 'datetime',
        'refunded_at'    => 'datetime',
        'expires_at'     => 'datetime',
        'amount'         => 'decimal:2',
        'subtotal'       => 'decimal:2',
        'discount'       => 'decimal:2',
        'tax'            => 'decimal:2',
        'service_charge' => 'decimal:2',
        'paid_amount'    => 'decimal:2',
        'balance'        => 'decimal:2',
        'refund_amount'  => 'decimal:2',
    ];

    // ── Boot: auto-generate payment_id ────────────────────────
    protected static function booted(): void
    {
        static::creating(function (self $payment) {
            if (empty($payment->payment_id)) {
                $last = static::max('id') ?? 0;
                $payment->payment_id = 'PAY-' . str_pad($last + 1, 3, '0', STR_PAD_LEFT);
            }
        });
    }

    // ── Relations ─────────────────────────────────────────────

    /** Polymorphic: Booking or FoodOrder */
    public function reference()
    {
        return $this->morphTo();
    }

    /** Guest who made the payment */
    public function guest()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /** Legacy: direct booking relation (kept for backward compat) */
    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }

    public function transactions()
    {
        return $this->hasMany(PaymentTransaction::class);
    }

    // ── Accessors ─────────────────────────────────────────────

    /** Structured breakdown — single source of truth from DB */
    public function getBreakdownAttribute(): array
    {
        return [
            'subtotal'       => (float) $this->subtotal,
            'discount'       => (float) $this->discount,
            'tax'            => (float) $this->tax,
            'service_charge' => (float) $this->service_charge,
            'total'          => (float) $this->amount,
            'paid'           => (float) $this->paid_amount,
            'balance'        => (float) $this->balance,
            'refund'         => (float) $this->refund_amount,
        ];
    }

    /** Never expose full card — only last 4 digits */
    public function getCardLast4Attribute(?string $value): ?string
    {
        return $value ? str_pad($value, 4, '0', STR_PAD_LEFT) : null;
    }
}
