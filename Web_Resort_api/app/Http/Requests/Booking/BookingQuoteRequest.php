<?php

namespace App\Http\Requests\Booking;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Only the *selection* is accepted from the client. Prices, discounts, tax,
 * service charge and totals are never read from the request.
 */
class BookingQuoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'room_ids' => ['required', 'array', 'min:1', 'max:10'],
            'room_ids.*' => ['integer', 'distinct', 'exists:rooms,id'],
            'check_in' => ['required', 'date'],
            'check_out' => ['required', 'date', 'after:check_in'],
            'adults' => ['nullable', 'integer', 'min:1', 'max:50'],
            'children' => ['nullable', 'integer', 'min:0', 'max:50'],
            'coupon_code' => ['nullable', 'string', 'max:50'],
            'branch_id' => ['required', 'integer', 'exists:branches,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'room_ids.required' => 'Select at least one room.',
            'branch_id.required' => 'A valid resort branch is required for price quotes.',
            'check_out.after' => 'Check-out must be after check-in.',
        ];
    }
}
