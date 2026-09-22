<?php

namespace App\Http\Controllers\Api\Room;

use App\Http\Controllers\Controller;
use App\Http\Requests\Room\IndexRoomRequest;
use App\Models\Room;
use App\Services\PricingService;
use App\Services\RoomService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class RoomController extends Controller
{
    public function __construct(protected RoomService $rooms) {}

    public function index(IndexRoomRequest $request): JsonResponse
    {
        $filters = $request->validated();
        if (! $request->user() && str_contains($request->path(), 'customer/')) {
            $filters['active_resorts_only'] = true;
        }
        $paginator = $this->rooms->paginate($filters);
        $payload = $paginator->toArray();
        $payload['stats'] = $this->rooms->stats($filters);
        return response()->json($payload);
    }

    public function show(Room $room): JsonResponse
    {
        return response()->json([
            'data' => $room->load(['roomType', 'branch', 'images', 'resort.facilities']),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'resort_id'       => 'required|exists:resorts,id',
            'branch_id'       => 'nullable|exists:branches,id',
            'room_type_id'    => 'required|exists:room_types,id',
            'room_number'     => [
                'required', 'string', 'max:20',
                Rule::unique('rooms', 'room_number')->where(
                    fn ($q) => $q->where('resort_id', $request->input('resort_id'))
                ),
            ],
            'floor'           => 'nullable|string|max:50',
            'view'            => 'nullable|string|max:100',
            'price_per_night' => 'required|numeric|min:0',
            // NULL means "inherit the room type discount".
            'discount_percent' => array_merge(['nullable'], PricingService::DISCOUNT_RULES),
            'status'          => 'required|in:available,occupied,maintenance,reserved',
            'notes'           => 'nullable|string',
        ]);
        $this->rooms->assertWritable($data);
        $room = Room::create($data);
        return response()->json(['data' => $room->load(['roomType', 'branch', 'images', 'resort.facilities'])], 201);
    }

    public function update(Request $request, Room $room): JsonResponse
    {
        $data = $request->validate([
            'resort_id'       => 'sometimes|exists:resorts,id',
            'branch_id'       => 'nullable|exists:branches,id',
            'room_type_id'    => 'sometimes|exists:room_types,id',
            'room_number'     => [
                'sometimes', 'string', 'max:20',
                Rule::unique('rooms', 'room_number')
                    ->ignore($room->id)
                    ->where(fn ($q) => $q->where('resort_id', $request->input('resort_id', $room->resort_id))),
            ],
            'floor'           => 'nullable|string|max:50',
            'view'            => 'nullable|string|max:100',
            'price_per_night' => 'sometimes|numeric|min:0',
            'discount_percent' => array_merge(['nullable'], PricingService::DISCOUNT_RULES),
            'status'          => 'sometimes|in:available,occupied,maintenance,reserved',
            'notes'           => 'nullable|string',
        ]);
        $this->rooms->assertWritable($data, $room);
        $room->update($data);
        return response()->json(['data' => $room->fresh()->load(['roomType', 'branch', 'images', 'resort.facilities'])]);
    }

    public function destroy(Room $room): JsonResponse
    {
        if ($this->rooms->hasBlockingBooking($room)) {
            return response()->json([
                'message' => 'This room cannot be deleted while it has a confirmed or checked-in booking.',
            ], 409);
        }
        $room->delete();
        return response()->json(null, 204);
    }
}
