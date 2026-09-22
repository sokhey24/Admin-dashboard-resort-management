<?php

namespace App\Http\Requests\Profile;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class ChangePasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'current_password' => 'required|string',
            'password'         => ['required', 'confirmed', 'different:current_password', Password::min(8)->letters()->numbers()],
        ];
    }

    public function messages(): array
    {
        return [
            'current_password.required' => 'Current password is required',
            'password.required' => 'New password is required',
            'password.min' => 'New password must be at least 8 characters',
            'password.confirmed' => 'Password confirmation does not match',
            'password.different' => 'New password must be different from current password',
        ];
    }
}
