<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Room extends Model
{
    protected $fillable = [
        'resort_id', 'branch_id', 'room_type_id',
        'room_number', 'floor', 'view',
        'price_per_night', 'discount_percent', 'status', 'notes',
    ];

    protected $casts = ['discount_percent' => 'float'];

    protected $appends = ['effective_discount_percent', 'discounted_price_per_night'];

    /** Own percentage, or the room type campaign when this room has no override. */
    public function getEffectiveDiscountPercentAttribute(): float
    {
        return app(\App\Services\PricingService::class)->resolveDiscountPercent($this);
    }

    public function getDiscountedPricePerNightAttribute(): float
    {
        $price = (float) $this->price_per_night;

        return round($price - ($price * $this->effective_discount_percent / 100), 2);
    }

    public function resort()   
    { return $this->belongsTo(Resort::class); 
    }
    public function branch()   
    { return $this->belongsTo(Branch::class);
     }
    public function roomType() 
    { return $this->belongsTo(RoomType::class); 
    }
    public function images()
    {
        return $this->hasMany(RoomImage::class)->orderByDesc('is_primary');
    }
    public function bookings() 
    { return $this->belongsToMany(Booking::class, 'booking_rooms'); 
    }
}
