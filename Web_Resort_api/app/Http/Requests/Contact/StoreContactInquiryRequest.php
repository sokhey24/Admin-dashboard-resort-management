<?php

namespace App\Http\Requests\Contact;

use App\Models\ContactInquiry;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreContactInquiryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'guest_name' => 'required|string|max:150',
            'guest_email' => 'required|email|max:150',
            'guest_phone' => 'required|string|max:50',
            'resort_name' => 'required|string|max:200',
            'subject' => ['required', 'string', Rule::in(ContactInquiry::SUBJECTS)],
            'message' => 'required|string|max:5000',
        ];
    }
}
