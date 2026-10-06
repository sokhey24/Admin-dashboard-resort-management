<?php

namespace App\Http\Requests\Review;

use Illuminate\Foundation\Http\FormRequest;

class StoreReviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    public function rules(): array
    {
        return [
            'room_id' => 'required|integer|exists:rooms,id',
            'rating'  => 'required|integer|min:1|max:5',
            'title'   => 'nullable|string|max:180',
            'comment' => 'required|string|max:5000',
        ];
    }
}
