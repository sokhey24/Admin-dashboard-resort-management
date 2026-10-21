<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\FoodOrder */
class FoodOrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_code' => $this->order_code,
            'status' => $this->status,
            'fulfillment_type' => $this->fulfillment_type,
            'payment_method' => $this->payment_method,
            'subtotal' => (float) $this->subtotal,
            'tax' => (float) $this->tax,
            'service_charge' => (float) ($this->service_charge ?? 0),
            'total' => (float) $this->total,
            'note' => $this->note,
            'booking_id' => $this->booking_id,
            'branch_id' => $this->branch_id,
            'restaurant_table_id' => $this->restaurant_table_id,
            'created_at' => $this->created_at?->toIso8601String(),
            'items' => $this->whenLoaded('orderItems', function () {
                return $this->orderItems->map(fn ($line) => [
                    'id' => $line->id,
                    'menu_item_id' => $line->menu_item_id,
                    'item_name' => $line->item_name,
                    'quantity' => (int) $line->quantity,
                    'unit_price' => (float) $line->unit_price,
                    'subtotal' => (float) $line->subtotal,
                ]);
            }),
        ];
    }
}
