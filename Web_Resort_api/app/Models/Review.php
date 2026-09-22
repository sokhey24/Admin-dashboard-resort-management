<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    public const STATUSES = ['pending', 'approved', 'rejected'];

    protected $fillable = [
        'user_id', 'room_id', 'booking_id', 'resort_id',
        'rating', 'title', 'comment', 'status',
    ];

    protected $casts = [
        'rating' => 'float',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    public function resort()
    {
        return $this->belongsTo(Resort::class);
    }

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }
}
