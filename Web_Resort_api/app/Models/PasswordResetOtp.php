<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PasswordResetOtp extends Model
{
    protected $fillable = [
        'email', 'otp', 'expires_at', 'used',
        'attempts', 'last_sent_at', 'verified_at',
        'reset_token', 'reset_token_expires_at',
    ];

    protected $casts = [
        'expires_at'             => 'datetime',
        'last_sent_at'           => 'datetime',
        'verified_at'            => 'datetime',
        'reset_token_expires_at' => 'datetime',
        'used'                   => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'email', 'email');
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function isLocked(): bool
    {
        return $this->attempts >= 5;
    }

    public function isResetTokenExpired(): bool
    {
        return !$this->reset_token_expires_at || $this->reset_token_expires_at->isPast();
    }

    public function canResend(): bool
    {
        if (!$this->last_sent_at) return true;
        return $this->last_sent_at->diffInSeconds(now()) >= 60;
    }

    public function secondsUntilResend(): int
    {
        if (!$this->last_sent_at) return 0;
        $diff = 60 - $this->last_sent_at->diffInSeconds(now());
        return max(0, (int) $diff);
    }
}
