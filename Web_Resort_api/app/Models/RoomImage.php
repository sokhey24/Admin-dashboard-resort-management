<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class RoomImage extends Model
{
    protected $fillable = ['room_id', 'image_path', 'is_primary'];

    protected $appends = ['url'];

    protected $casts = [
        'is_primary' => 'boolean',
    ];

    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    public function getUrlAttribute(): ?string
    {
        if (!$this->image_path) {
            return null;
        }

        return Storage::disk('public')->url($this->image_path);
    }
}
