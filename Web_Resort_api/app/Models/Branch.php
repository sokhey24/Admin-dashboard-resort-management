<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Branch extends Model
{
    protected $fillable = ['resort_id', 'name', 'address', 'phone', 'manager_name', 'status'];

    public function resort()    { return $this->belongsTo(Resort::class); }
    public function rooms()     { return $this->hasMany(Room::class); }
    public function roomTypes() { return $this->hasMany(RoomType::class); }
}
