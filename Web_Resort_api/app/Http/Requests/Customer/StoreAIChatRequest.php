<?php

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAIChatRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'messages' => ['required', 'array', 'min:1', 'max:40'],
            'messages.*.text' => ['required', 'string', 'max:8000'],
            'messages.*.role' => ['required', 'string', Rule::in(['user', 'model'])],
            'branch_id' => ['nullable', 'integer', 'exists:branches,id'],
            'branch_name' => ['nullable', 'string', 'max:255'],
            'language' => ['nullable', 'string', Rule::in(['en', 'km'])],
            'catalog_context' => ['nullable', 'string', 'max:16000'],
        ];
    }
}
