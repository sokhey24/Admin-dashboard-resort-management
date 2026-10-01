<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RestaurantBill extends Model
{
    protected $fillable = [
        'food_order_id',
        'bill_number',
        'subtotal',
        'tax',
        'discount',
        'total',
        'payment_method',
        'status',
        'paid_at',
    ];

    protected $casts = ['paid_at' => 'datetime'];

    public function order()
    {
        return $this->belongsTo(FoodOrder::class, 'food_order_id');
    }
}
