<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Safe payment shape for JSON responses — excludes QR secrets and card data.
 */
class PaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'payment_id' => $this->payment_id,
            'source' => $this->source,
            'booking_id' => $this->booking_id,
            'user_id' => $this->user_id,
            'amount' => $this->amount !== null ? (float) $this->amount : null,
            'currency' => $this->currency,
            'payment_method' => $this->payment_method ?? $this->method,
            'status' => $this->status,
            'paid_amount' => $this->paid_amount !== null ? (float) $this->paid_amount : null,
            'balance' => $this->balance !== null ? (float) $this->balance : null,
            'paid_at' => optional($this->paid_at)?->toIso8601String(),
            'created_at' => optional($this->created_at)?->toIso8601String(),
            'updated_at' => optional($this->updated_at)?->toIso8601String(),
        ];
    }
}
