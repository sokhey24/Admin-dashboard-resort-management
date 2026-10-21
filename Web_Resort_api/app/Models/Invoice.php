<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    protected $fillable = [
        'booking_id', 'payment_id', 'invoice_number', 'amount', 'discount', 'tax',
        'service_charge', 'total', 'issued_at', 'due_at', 'status',
        'pdf_disk', 'pdf_path', 'pdf_generated_at',
    ];

    protected $casts = [
        'issued_at' => 'datetime',
        'due_at' => 'datetime',
        'pdf_generated_at' => 'datetime',
    ];

    public function booking() { 
        return $this->belongsTo(Booking::class); 
    }
}
