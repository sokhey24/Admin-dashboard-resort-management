<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GalleryPhoto extends Model
{
    protected $fillable = ['resort_id', 'path'];

    public function resort()
    {
        return $this->belongsTo(Resort::class);
    }
}
