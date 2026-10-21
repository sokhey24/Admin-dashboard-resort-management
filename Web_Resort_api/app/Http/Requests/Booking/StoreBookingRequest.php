<?php

namespace App\Http\Requests\Booking;

use Illuminate\Foundation\Http\FormRequest;

class StoreBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    public function rules(): array
    {
        return [
            'user_id' => 'nullable|exists:users,id',
            'resort_id' => 'required|exists:resorts,id',
            'coupon_id' => 'nullable|exists:coupons,id',
            'adults' => 'nullable|integer|min:1',
            'children' => 'nullable|integer|min:0',
            'check_in' => 'required|date',
            'check_out' => 'required|date|after:check_in',
            'coupon_code' => 'nullable|string|max:50',
            'tax_amount' => 'nullable|numeric|min:0',
            'service_charge_amount' => 'nullable|numeric|min:0',
            'special_requests' => 'nullable|string',
            'room_ids' => 'required|array|min:1',
            'room_ids.*' => 'exists:rooms,id',
            'branch_id' => 'nullable|integer|exists:branches,id',
            'source' => 'nullable|in:walk_in,website,phone,ota,staff',
        ];
    }
}
