<?php

namespace App\Http\Requests\Service;

use Illuminate\Foundation\Http\FormRequest;

class StoreServiceInquiryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'service_title' => 'required|string|max:200',
            'service_id' => 'nullable|string|max:191',
            'preferred_date' => 'required|date|after_or_equal:today',
            'resort_name' => 'required|string|max:200',
            'guest_count' => 'required|integer|min:1|max:50',
            'guest_name' => 'required|string|max:150',
            'guest_email' => 'required|email|max:150',
            'guest_phone' => 'required|string|max:50',
            'special_requests' => 'nullable|string|max:1000',
        ];
    }
}
