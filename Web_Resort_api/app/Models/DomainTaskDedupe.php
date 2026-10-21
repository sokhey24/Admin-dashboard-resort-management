<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DomainTaskDedupe extends Model
{
    public $timestamps = false;

    protected $fillable = ['task_key'];

    protected $casts = [
        'created_at' => 'datetime',
    ];
}
