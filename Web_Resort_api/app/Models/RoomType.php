<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RoomType extends Model
{
    protected $fillable = [
        'resort_id', 'name', 'description', 'base_price', 'discount_percent', 'max_occupancy',
        'bed_count', 'bed_type', 'size_sqm', 'amenities', 'breakfast_included', 'free_cancellation',
        'status',
    ];

    protected $casts = [
        'discount_percent' => 'float',
        'amenities' => 'array',
        'breakfast_included' => 'boolean',
        'free_cancellation' => 'boolean',
    ];

    protected $appends = ['discounted_base_price'];

    public function getDiscountedBasePriceAttribute(): float
    {
        $price = (float) $this->base_price;
        $percent = (float) ($this->discount_percent ?? 0);

        return round($price - ($price * $percent / 100), 2);
    }

    public function resort() { return $this->belongsTo(Resort::class); }
    public function rooms()  { return $this->hasMany(Room::class); }
}
