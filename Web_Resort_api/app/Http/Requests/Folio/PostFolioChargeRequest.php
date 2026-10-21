<?php

namespace App\Http\Requests\Folio;

use App\Models\FolioCharge;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PostFolioChargeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'charge_type' => ['required', Rule::in(FolioCharge::INCIDENTAL_TYPES)],
            'description' => 'required|string|max:255',
            'quantity' => 'nullable|numeric|min:0.01|max:9999',
            'unit_price' => 'nullable|numeric|min:0|max:999999.99',
            'amount' => 'nullable|numeric|max:999999.99',
            'note' => 'nullable|string|max:1000',
            'idempotency_key' => 'nullable|string|max:128',
        ];
    }
}
