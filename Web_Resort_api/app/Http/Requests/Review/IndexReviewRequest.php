<?php

namespace App\Http\Requests\Review;

use App\Services\ReviewService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexReviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'page'       => 'sometimes|integer|min:1',
            'per_page'   => 'sometimes|integer|min:1|max:50',
            'search'     => 'nullable|string|max:255',
            'rating'     => 'nullable|numeric|min:1|max:5',
            'status'     => ['nullable', Rule::in(ReviewService::STATUSES)],
            'resort_id'  => 'nullable|integer|exists:resorts,id',
            'branch_id'  => 'nullable|integer|exists:branches,id',
            'date_from'  => 'nullable|date',
            'date_to'    => 'nullable|date|after_or_equal:date_from',
        ];
    }
}
