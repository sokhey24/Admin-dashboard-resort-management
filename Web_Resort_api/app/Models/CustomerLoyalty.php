<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerLoyalty extends Model
{
    protected $table = 'customer_loyalty';

    protected $fillable = [
        'user_id',
        'points',
        'tier',
        'points_target',
    ];

    protected $casts = [
        'points' => 'integer',
        'points_target' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
