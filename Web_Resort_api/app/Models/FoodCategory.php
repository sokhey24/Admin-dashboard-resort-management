<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FoodCategory extends Model
{
    protected $fillable = ['resort_id', 'name', 'description'];

    public function resort()    { return $this->belongsTo(Resort::class); }
    public function menuItems() { return $this->hasMany(MenuItem::class); }
}
