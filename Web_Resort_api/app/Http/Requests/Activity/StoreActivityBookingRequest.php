<?php

namespace App\Http\Requests\Activity;

use Illuminate\Foundation\Http\FormRequest;

class StoreActivityBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'activity_title' => 'required|string|max:200',
            'activity_id' => 'nullable|string|max:191',
            'booking_date' => 'required|date|after_or_equal:today',
            'guest_count' => 'required|integer|min:1|max:50',
            'total_price' => 'required|numeric|min:0',
            'guest_name' => 'required|string|max:150',
            'guest_email' => 'required|email|max:150',
            'guest_phone' => 'required|string|max:50',
            'special_requests' => 'nullable|string|max:1000',
        ];
    }
}
