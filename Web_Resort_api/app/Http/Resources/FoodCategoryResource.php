<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FoodCategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $customerCatalog = $request->is('api/customer/*') || $request->is('customer/*');

        $data = [
            'id' => $this->id,
            'name' => $this->name,
            'image' => $this->image,
            'menu_items_count' => $this->when(isset($this->menu_items_count), (int) $this->menu_items_count),
            'branch' => $this->whenLoaded('branch', fn () => $customerCatalog
                ? ['name' => $this->branch?->name]
                : BranchResource::make($this->branch)->resolve()),
        ];

        if (! $customerCatalog) {
            $data['resort_id'] = $this->resort_id;
            $data['branch_id'] = $this->branch_id;
            $data['status'] = $this->status;
            $data['created_at'] = optional($this->created_at)?->toIso8601String();
            $data['updated_at'] = optional($this->updated_at)?->toIso8601String();
        }

        return $data;
    }
}
