<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RestaurantTable extends Model
{
    protected $fillable = ['resort_id', 'table_number', 'capacity', 'location', 'status'];

    /** The resort this table belongs to (restaurant_tables.resort_id → resorts.id) */
    public function resort()       { return $this->belongsTo(Resort::class); }

    public function reservations() { return $this->hasMany(TableReservation::class, 'restaurant_table_id'); }
    public function foodOrders()   { return $this->hasMany(FoodOrder::class, 'restaurant_table_id'); }
}
