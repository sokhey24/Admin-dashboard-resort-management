<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Guest extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'guest_code',
        'first_name',
        'last_name',
        'email',
        'phone',
        'nationality',
        'passport_number',
        'date_of_birth',
        'gender',
        'address',
        'city',
        'country',
        'id_type',
        'id_number',
        'vip_level',
        'total_stays',
        'total_spent',
        'notes',
        'status',
        'created_by',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'total_spent' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }
}
