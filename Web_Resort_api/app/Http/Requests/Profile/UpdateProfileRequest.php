<?php

namespace App\Http\Requests\Profile;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        $this->replace($this->except(\App\Services\ProfileService::PROTECTED_FIELDS));
    }

    public function rules(): array
    {
        $userId = $this->user()->id;

        return [
            'name'          => 'sometimes|required|string|max:255',
            'phone'         => "sometimes|nullable|string|max:20|unique:users,phone,{$userId}",
            'gender'        => 'sometimes|nullable|in:male,female,other',
            'date_of_birth' => 'sometimes|nullable|date|before:today',
            'address'       => 'sometimes|nullable|string|max:500',
            'profile_image' => 'sometimes|nullable|image|mimes:jpg,jpeg,png|max:2048',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Full name is required',
            'name.max' => 'Full name cannot exceed 255 characters',
            'phone.unique' => 'This phone number is already registered',
            'phone.max' => 'Phone number cannot exceed 20 characters',
            'gender.in' => 'Gender must be male, female, or other',
            'date_of_birth.date' => 'Invalid date format',
            'date_of_birth.before' => 'Date of birth must be in the past',
            'address.max' => 'Address cannot exceed 500 characters',
            'profile_image.image' => 'File must be an image',
            'profile_image.mimes' => 'Image must be JPG, JPEG, or PNG format',
            'profile_image.max' => 'Image size cannot exceed 2MB',
        ];
    }
}
