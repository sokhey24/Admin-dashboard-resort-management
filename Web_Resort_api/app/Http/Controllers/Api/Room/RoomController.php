<?php

namespace App\Http\Controllers\Api\Room;

use App\Http\Controllers\Controller;
use App\Http\Requests\Room\IndexRoomRequest;
use App\Models\Room;
use App\Services\PricingService;
use App\Services\RoomService;
use Carbon\Carbon;
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
        $paginator = $this->rooms->paginate($filters, $request->user());

        if (
            ! empty($filters['check_in'])
            && ! empty($filters['check_out'])
            && ! empty($filters['include_booked'])
        ) {
            $checkIn = Carbon::parse($filters['check_in'])->startOfDay();
            $checkOut = Carbon::parse($filters['check_out'])->startOfDay();
            $this->rooms->attachStayAvailability(
                $paginator->getCollection(),
                $checkIn,
                $checkOut,
                isset($filters['exclude_booking_id']) ? (int) $filters['exclude_booking_id'] : null
            );
        }

        $payload = $paginator->toArray();
        $payload['stats'] = $this->rooms->stats($filters, $request->user());
        return response()->json($payload);
    }

    public function show(Request $request, Room $room): JsonResponse
    {
        if ($request->user() && str_contains($request->path(), 'admin/') && $room->branch_id) {
            app(\App\Services\BranchAccessService::class)->assertBranchAccessible($request->user(), (int) $room->branch_id);
        }

        return response()->json([
            'data' => $room->load(['roomType', 'branch', 'images', 'resort.facilities']),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'resort_id'       => 'nullable|exists:resorts,id',
            'branch_id'       => 'required|exists:branches,id',
            'room_type_id'    => 'required|exists:room_types,id',
            'room_number'     => [
                'required', 'string', 'max:20',
                Rule::unique('rooms', 'room_number')->where(
                    fn ($q) => $q->where('branch_id', $request->input('branch_id'))
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

        if (empty($data['resort_id'])) {
            $data['resort_id'] = \App\Models\Branch::find($data['branch_id'])?->resort_id ?? \App\Models\Resort::getBrand()?->id;
        }

        if (! empty($data['branch_id'])) {
            app(\App\Services\BranchAccessService::class)->assertBranchAccessible($request->user(), (int) $data['branch_id']);
        }

        $this->rooms->assertWritable($data);
        $room = Room::create($data);
        return response()->json(['data' => $room->load(['roomType', 'branch', 'images', 'resort.facilities'])], 201);
    }

    public function update(Request $request, Room $room): JsonResponse
    {
        if ($room->branch_id) {
            app(\App\Services\BranchAccessService::class)->assertBranchAccessible($request->user(), (int) $room->branch_id);
        }

        $data = $request->validate([
            'resort_id'       => 'sometimes|exists:resorts,id',
            'branch_id'       => 'nullable|exists:branches,id',
            'room_type_id'    => 'sometimes|exists:room_types,id',
            'room_number'     => [
                'sometimes', 'string', 'max:20',
                Rule::unique('rooms', 'room_number')
                    ->where(fn ($q) => $q->where('branch_id', $request->input('branch_id', $room->branch_id)))
                    ->ignore($room->id),
            ],
            'floor'           => 'nullable|string|max:50',
            'view'            => 'nullable|string|max:100',
            'price_per_night' => 'sometimes|numeric|min:0',
            'discount_percent' => array_merge(['nullable'], PricingService::DISCOUNT_RULES),
            'status'          => 'sometimes|in:available,occupied,maintenance,reserved',
            'notes'           => 'nullable|string',
        ]);

        if (! empty($data['branch_id'])) {
            app(\App\Services\BranchAccessService::class)->assertBranchAccessible($request->user(), (int) $data['branch_id']);
        }

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
