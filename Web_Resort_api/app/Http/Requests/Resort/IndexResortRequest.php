<?php

namespace App\Http\Requests\Resort;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexResortRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'page'           => 'sometimes|integer|min:1',
            'per_page'       => 'sometimes|integer|min:1|max:50',
            'search'         => 'nullable|string|max:255',
            'destination'    => 'nullable|string|max:255',
            'city'           => 'nullable|string|max:255',
            'country'        => 'nullable|string|max:255',
            'status'         => ['nullable', Rule::in(['active', 'inactive'])],
            'branch_id'      => 'nullable|integer|exists:branches,id',
            'price_min'      => 'nullable|numeric|min:0',
            'price_max'      => 'nullable|numeric|min:0',
            'min_rating'     => 'nullable|numeric|min:0|max:5',
            'sort'           => ['nullable', Rule::in(['recommended', 'price_asc', 'price_desc', 'rating', 'reviews', 'name'])],
            'has_availability' => 'sometimes|boolean',
        ];
    }
}
