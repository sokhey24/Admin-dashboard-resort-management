<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class FolioCharge extends Model
{
    public const INCIDENTAL_TYPES = [
        'minibar',
        'laundry',
        'spa',
        'restaurant',
        'transportation',
        'extra_bed',
        'service',
        'adjustment',
        'discount',
    ];

    protected $fillable = [
        'guest_folio_id',
        'charge_type',
        'description',
        'quantity',
        'unit_price',
        'amount',
        'reference_type',
        'reference_id',
        'idempotency_key',
        'posted_by',
        'posted_at',
        'note',
        'voided_at',
        'voided_by',
        'void_reason',
    ];

    protected $casts = [
        'posted_at' => 'datetime',
        'voided_at' => 'datetime',
    ];

    public function folio(): BelongsTo
    {
        return $this->belongsTo(GuestFolio::class, 'guest_folio_id');
    }

    public function postedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'posted_by');
    }

    public function voidedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'voided_by');
    }

    public function reference(): MorphTo
    {
        return $this->morphTo();
    }

    public function isVoided(): bool
    {
        return $this->voided_at !== null;
    }
}
