<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FoodOrder extends Model
{
    protected $fillable = ['user_id', 'restaurant_table_id', 'booking_id', 'order_code', 'subtotal', 'tax', 'total', 'status', 'note'];

    public function restaurantTable() { return $this->belongsTo(RestaurantTable::class); }
    public function user()            { return $this->belongsTo(User::class); }
    public function booking()         { return $this->belongsTo(Booking::class); }
    public function orderItems()      { return $this->hasMany(FoodOrderItem::class); }
    public function bill()            { return $this->hasOne(RestaurantBill::class); }
}
