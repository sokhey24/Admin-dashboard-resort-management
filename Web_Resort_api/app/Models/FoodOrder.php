<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FoodOrder extends Model
{
    protected $fillable = [
        'user_id', 'restaurant_table_id', 'branch_id', 'booking_id', 'order_code', 'client_request_id',
        'fulfillment_type', 'payment_method', 'subtotal', 'tax', 'service_charge', 'total', 'status', 'note',
    ];

    public function restaurantTable() { return $this->belongsTo(RestaurantTable::class); }

    public function branch()            { 
        return $this->belongsTo(Branch::class); 
    }
    public function user()            { 
        return $this->belongsTo(User::class); 
    }
    public function booking()         {
         return $this->belongsTo(Booking::class); 
        }
    public function orderItems()      { 
        return $this->hasMany(FoodOrderItem::class); 
    }
    public function bill()            { 
        return $this->hasOne(RestaurantBill::class); 
    }
}
