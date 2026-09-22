<?php

namespace App\Http\Requests\Profile;

use Illuminate\Foundation\Http\FormRequest;

class ConfirmTwoFactorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'code' => 'required|string|size:6',
        ];
    }

    public function messages(): array
    {
        return [
            'code.required' => 'Enter the 6-digit authenticator code.',
            'code.size' => 'The authenticator code must be 6 digits.',
        ];
    }
}
