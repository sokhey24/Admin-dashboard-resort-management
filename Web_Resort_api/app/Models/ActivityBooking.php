<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActivityBooking extends Model
{
    public const STATUSES = ['pending', 'confirmed', 'cancelled'];

    protected $fillable = [
        'user_id',
        'activity_title',
        'activity_id',
        'booking_date',
        'guest_count',
        'total_price',
        'guest_name',
        'guest_email',
        'guest_phone',
        'special_requests',
        'status',
    ];

    protected $casts = [
        'booking_date' => 'date',
        'guest_count' => 'integer',
        'total_price' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
