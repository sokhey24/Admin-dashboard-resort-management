<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContactInquiry extends Model
{
    public const STATUSES = ['pending', 'confirmed', 'cancelled'];

    public const SUBJECTS = ['general', 'wedding', 'corporate', 'press'];

    protected $fillable = [
        'user_id',
        'guest_name',
        'guest_email',
        'guest_phone',
        'resort_name',
        'subject',
        'message',
        'status',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
