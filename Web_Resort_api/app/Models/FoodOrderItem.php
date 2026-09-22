<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FoodOrderItem extends Model
{
    protected $fillable = ['food_order_id', 'menu_item_id', 'quantity', 'unit_price', 'subtotal'];

    public function foodOrder() { return $this->belongsTo(FoodOrder::class); }
    public function menuItem()  { return $this->belongsTo(MenuItem::class); }
}
