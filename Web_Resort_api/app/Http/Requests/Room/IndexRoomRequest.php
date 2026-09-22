<?php

namespace App\Http\Requests\Room;

use App\Services\RoomService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexRoomRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'page'         => 'sometimes|integer|min:1',
            'per_page'     => 'sometimes|integer|min:1|max:50',
            'search'       => 'nullable|string|max:255',
            'status'       => ['nullable', Rule::in(RoomService::STATUSES)],
            'room_type_id' => 'nullable|integer|exists:room_types,id',
            'resort_id'    => 'nullable|integer|exists:resorts,id',
            'branch_id'    => 'nullable|integer|exists:branches,id',
            'check_in'     => 'nullable|date',
            'check_out'    => 'nullable|date|after:check_in',
            'exclude_booking_id' => 'nullable|integer|exists:bookings,id',
        ];
    }
}
