<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServiceInquiry extends Model
{
    public const STATUSES = ['pending', 'confirmed', 'cancelled'];

    protected $fillable = [
        'user_id',
        'service_title',
        'service_id',
        'preferred_date',
        'resort_name',
        'guest_count',
        'guest_name',
        'guest_email',
        'guest_phone',
        'special_requests',
        'status',
    ];

    protected $casts = [
        'preferred_date' => 'date',
        'guest_count' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
