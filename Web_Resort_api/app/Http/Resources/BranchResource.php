<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BranchResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $customerCatalog = $request->is('api/customer/*') || $request->is('customer/*');

        if ($customerCatalog) {
            return [
                'id' => $this->id,
                'name' => $this->name,
                'address' => $this->address,
                'city' => $this->city,
                'contact_phone' => $this->contact_phone,
                'contact_email' => $this->contact_email,
                'status' => $this->status,
            ];
        }

        return [
            'id' => $this->id,
            'resort_id' => $this->resort_id,
            'name' => $this->name,
            'address' => $this->address,
            'city' => $this->city,
            'contact_phone' => $this->contact_phone,
            'contact_email' => $this->contact_email,
            'status' => $this->status,
            'is_active' => $this->is_active,
            'created_at' => optional($this->created_at)?->toIso8601String(),
            'updated_at' => optional($this->updated_at)?->toIso8601String(),
        ];
    }
}
