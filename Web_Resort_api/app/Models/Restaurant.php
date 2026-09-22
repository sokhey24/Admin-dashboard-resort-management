<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Restaurant extends Model
{
    protected $fillable = [
        'resort_id', 'name', 'slug', 'description',
        'phone', 'email', 'address', 'logo', 'status',
    ];

    public function resort()
    {
        return $this->belongsTo(Resort::class);
    }
}
