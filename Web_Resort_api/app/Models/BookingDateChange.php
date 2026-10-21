<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookingDateChange extends Model
{
    protected $fillable = [
        'booking_id',
        'changed_by',
        'previous_check_in',
        'previous_check_out',
        'new_check_in',
        'new_check_out',
        'previous_total',
        'new_total',
        'price_difference',
        'currency',
        'reason',
        'source',
    ];

    protected $casts = [
        'previous_check_in' => 'date',
        'previous_check_out' => 'date',
        'new_check_in' => 'date',
        'new_check_out' => 'date',
        'previous_total' => 'float',
        'new_total' => 'float',
        'price_difference' => 'float',
    ];

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
