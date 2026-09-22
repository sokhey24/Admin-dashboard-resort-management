<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    public const STATUS_PENDING = 'pending';

    public const STATUS_PAID = 'paid';

    public const STATUS_EXPIRED = 'expired';

    public const STATUS_MISMATCHED = 'mismatched';

    protected $fillable = [
        'product_id',
        'md5',
        'qr_payload',
        'amount',
        'currency',
        'status',
        'bakong_hash',
        'expires_at',
        'paid_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'expires_at' => 'datetime',
        'paid_at' => 'datetime',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function isPaid(): bool
    {
        return $this->status === self::STATUS_PAID;
    }

    public function isExpired(): bool
    {
        return ! $this->isPaid() && $this->expires_at->isPast();
    }

    public function secondsRemaining(): int
    {
        return max(0, (int) now()->diffInSeconds($this->expires_at, false));
    }
}
