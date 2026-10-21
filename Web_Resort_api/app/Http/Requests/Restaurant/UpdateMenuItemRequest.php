<?php

namespace App\Http\Requests\Restaurant;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMenuItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    public function rules(): array
    {
        $rules = [
            'food_category_id' => 'sometimes|exists:food_categories,id',
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'price' => 'sometimes|numeric|min:0',
            'is_available' => 'sometimes|boolean',
            'status' => 'sometimes|in:active,inactive',
        ];

        if ($this->hasFile('image')) {
            $rules['image'] = 'image|max:2048';
        } else {
            $rules['image'] = 'nullable|string|max:2048';
        }

        return $rules;
    }
}
