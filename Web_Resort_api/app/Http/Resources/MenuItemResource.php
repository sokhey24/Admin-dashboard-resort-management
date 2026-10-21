<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MenuItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $customerCatalog = $request->is('api/customer/*') || $request->is('customer/*');

        $data = [
            'id' => $this->id,
            'food_category_id' => $this->food_category_id,
            'name' => $this->name,
            'description' => $this->description,
            'price' => $this->price !== null ? (float) $this->price : null,
            'image' => $this->image,
            'is_available' => (bool) $this->is_available,
            'created_at' => optional($this->created_at)?->toIso8601String(),
            'updated_at' => optional($this->updated_at)?->toIso8601String(),
            'category' => $this->whenLoaded('category', fn () => FoodCategoryResource::make($this->category)->resolve()),
        ];

        if (! $customerCatalog) {
            $data['status'] = $this->status;
        }

        return $data;
    }
}
