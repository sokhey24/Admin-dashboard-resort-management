<?php

namespace App\Http\Requests\Folio;

use Illuminate\Foundation\Http\FormRequest;

class VoidFolioChargeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'void_reason' => 'required|string|min:3|max:500',
        ];
    }
}
