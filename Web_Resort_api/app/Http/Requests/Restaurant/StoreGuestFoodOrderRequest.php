<?php

namespace App\Http\Requests\Restaurant;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreGuestFoodOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    public function rules(): array
    {
        return [
            'client_request_id' => 'nullable|string|max:64',
            'fulfillment_type' => ['required', Rule::in(['dine_in', 'room_delivery'])],
            'booking_id' => 'required_if:fulfillment_type,room_delivery|nullable|integer|exists:bookings,id',
            'payment_method' => ['required', Rule::in(['cash', 'khqr', 'charge_to_room'])],
            'note' => 'nullable|string|max:1000',
            'items' => 'required|array|min:1|max:50',
            'items.*.menu_item_id' => 'required|integer|exists:menu_items,id',
            'items.*.quantity' => 'required|integer|min:1|max:99',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->payment_method === 'charge_to_room' && $this->fulfillment_type !== 'room_delivery') {
            $this->merge(['fulfillment_type' => 'room_delivery']);
        }
    }
}
