<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentTransaction extends Model
{
    protected $fillable = ['payment_id', 'gateway', 'gateway_ref', 'amount', 'status', 'response_data'];

    protected $casts = ['response_data' => 'array'];

    public function payment()
    {
        return $this->belongsTo(Payment::class);
    }
}
