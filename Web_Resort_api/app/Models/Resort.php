<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Resort extends Model
{
    protected $fillable = [
        'name',
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
        'email',
        'website',
        'logo',
        'cover_image',
        'status',
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

    public function branches(){ 
        return $this->hasMany(Branch::class); 
        }

    /** Physical rooms (direct resort_id). Prefer this for counts and catalog pricing. */
    public function directRooms()
    {
        return $this->hasMany(Room::class);
    }
    public function facilities(){
        return $this->hasMany(Facility::class);
        }
    public function reviews(){ 
        return $this->hasMany(Review::class);
        }
    public function rooms(){ 
        return $this->hasManyThrough(Room::class, Branch::class); 
        }
    public function roomTypes(){ 
        return $this->hasMany(RoomType::class); 
        }
    public function foodCategories(){ 
        return $this->hasMany(FoodCategory::class); 
        }
    public function restaurants(){
        return $this->hasMany(Restaurant::class);
        }
}
