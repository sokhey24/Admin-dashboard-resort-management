<?php

namespace App\Http\Requests\Profile;

use Illuminate\Foundation\Http\FormRequest;

class UploadAvatarRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'avatar' => 'required|image|mimes:jpg,jpeg,png|max:2048|dimensions:min_width=100,min_height=100,max_width=2000,max_height=2000',
        ];
    }

    public function messages(): array
    {
        return [
            'avatar.required' => 'Please select an image to upload',
            'avatar.image' => 'File must be an image',
            'avatar.mimes' => 'Image must be JPG, JPEG, or PNG format',
            'avatar.max' => 'Image size cannot exceed 2MB',
            'avatar.dimensions' => 'Image dimensions must be between 100x100 and 2000x2000 pixels',
        ];
    }
}
