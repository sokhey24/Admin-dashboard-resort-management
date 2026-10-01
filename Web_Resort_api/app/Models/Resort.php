<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Resort extends Model
{
    protected $fillable = [
        'name',
        'brand_name',
        'slug',
        'description',
        'resort_type',
        'stars',
        'promo_tag',
        'tagline',
        'address',
        'city',
        'country',
        'phone',
        'central_phone',
        'email',
        'central_email',
        'website',
        'logo',
        'favicon',
        'cover_image',
        'status',
        'terms_and_conditions',
        'free_cancellation',
        'breakfast_options',
        'featured',
    ];

    protected $casts = [
        'stars' => 'integer',
        'free_cancellation' => 'boolean',
        'breakfast_options' => 'boolean',
        'featured' => 'boolean',
    ];

    /**
     * Retrieve the single company/active brand configuration entity (ID: 1, active brand, or first record).
     */
    public static function getBrand(): ?self
    {
        return static::find(1)
            ?? static::where('status', 'active')->first()
            ?? static::first();
    }

    public function getBrandNameAttribute(?string $value): string
    {
        return $value ?: ($this->attributes['name'] ?? 'Solara Resort & Spa');
    }

    public function getCentralPhoneAttribute(?string $value): ?string
    {
        return $value ?: ($this->attributes['phone'] ?? null);
    }

    public function getCentralEmailAttribute(?string $value): ?string
    {
        return $value ?: ($this->attributes['email'] ?? null);
    }

    public function branches()
    {
        return $this->hasMany(Branch::class);
    }

    /**
     * Physical rooms (direct resort_id). Prefer this for counts and catalog pricing.
     */
    public function directRooms()
    {
        return $this->hasMany(Room::class);
    }

    public function facilities()
    {
        return $this->hasMany(Facility::class);
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    public function rooms()
    {
        return $this->hasManyThrough(Room::class, Branch::class);
    }

    public function roomTypes()
    {
        return $this->hasMany(RoomType::class);
    }

    public function foodCategories()
    {
        return $this->hasMany(FoodCategory::class);
    }

    public function restaurants()
    {
        return $this->hasMany(Restaurant::class);
    }
}
