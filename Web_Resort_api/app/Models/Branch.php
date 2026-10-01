<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Branch extends Model
{
    protected $fillable = [
        'resort_id',
        'name',
        'slug',
        'city',
        'province',
        'address',
        'phone',
        'email',
        'cover_image',
        'latitude',
        'longitude',
        'stars',
        'manager_name',
        'status',
        'checkin_time',
        'checkout_time',
        'is_active',
    ];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
        'stars' => 'integer',
        'is_active' => 'boolean',
    ];

    public function resort()
    {
        return $this->belongsTo(Resort::class);
    }

    public function rooms()
    {
        return $this->hasMany(Room::class);
    }

    public function roomTypes()
    {
        return $this->hasMany(RoomType::class);
    }

    public function restaurantTables()
    {
        return $this->hasMany(RestaurantTable::class);
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'user_branch')
            ->withPivot(['role', 'is_primary', 'assigned_at']);
    }

    /**
     * Retrieve the model for a bound value (supports both ID and slug).
     */
    public function resolveRouteBinding($value, $field = null)
    {
        if ($field) {
            return parent::resolveRouteBinding($value, $field);
        }

        if (is_numeric($value)) {
            return $this->where('id', (int) $value)->firstOrFail();
        }

        return $this->where('slug', $value)->firstOrFail();
    }
}

