<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BookingStatusLog extends Model
{
    protected $fillable = ['booking_id', 'old_status', 'new_status', 'changed_by', 'note'];

    public function booking() { return $this->belongsTo(Booking::class); }
    public function changedBy() { return $this->belongsTo(User::class, 'changed_by'); }
}
