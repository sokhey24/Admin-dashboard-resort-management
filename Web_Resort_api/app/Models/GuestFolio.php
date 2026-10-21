<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GuestFolio extends Model
{
    public const STATUSES = ['open', 'closed'];

    public const CHARGEABLE_BOOKING_STATUSES = ['confirmed', 'checked_in', 'checked_out'];

    public const VIEWABLE_BOOKING_STATUSES = ['confirmed', 'checked_in', 'checked_out', 'completed'];

    protected $fillable = [
        'folio_number',
        'booking_id',
        'guest_id',
        'resort_id',
        'status',
        'currency',
        'opened_at',
        'closed_at',
    ];

    protected $casts = [
        'opened_at' => 'datetime',
        'closed_at' => 'datetime',
    ];

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function guest(): BelongsTo
    {
        return $this->belongsTo(Guest::class);
    }

    public function resort(): BelongsTo
    {
        return $this->belongsTo(Resort::class);
    }

    public function charges(): HasMany
    {
        return $this->hasMany(FolioCharge::class);
    }

    public function activeCharges(): HasMany
    {
        return $this->charges()->whereNull('voided_at');
    }

    public function isOpen(): bool
    {
        return $this->status === 'open';
    }
}
