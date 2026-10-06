<?php

namespace App\Http\Requests\Review;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCustomerReviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    public function rules(): array
    {
        return [
            'rating'  => 'sometimes|integer|min:1|max:5',
            'title'   => 'sometimes|nullable|string|max:180',
            'comment' => 'sometimes|required|string|max:5000',
        ];
    }
}
