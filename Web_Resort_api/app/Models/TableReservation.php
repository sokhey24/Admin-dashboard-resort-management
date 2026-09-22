<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TableReservation extends Model
{
    protected $fillable = ['user_id', 'restaurant_table_id', 'reserved_at', 'party_size', 'status', 'note'];

    protected $casts = ['reserved_at' => 'datetime'];

    public function user()  { return $this->belongsTo(User::class); }
    public function table() { return $this->belongsTo(RestaurantTable::class, 'restaurant_table_id'); }
}
