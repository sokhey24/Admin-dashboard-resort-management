<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FoodCategory extends Model
{
    protected $fillable = ['resort_id', 'branch_id', 'name', 'description', 'image', 'status'];

    public function resort()    { 
        return $this->belongsTo(Resort::class); 
    }

    public function branch()    { 
        return $this->belongsTo(Branch::class);
     }
    public function menuItems() { 
        return $this->hasMany(MenuItem::class); 
    }
}
