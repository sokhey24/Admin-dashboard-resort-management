<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MenuItem extends Model
{
    protected $fillable = ['food_category_id', 'name', 'description', 'price', 'image', 'is_available'];

    public function category(){ 
        return $this->belongsTo(FoodCategory::class, 'food_category_id'); }
    public function orderItems() { 
        return $this->hasMany(FoodOrderItem::class); }
}
