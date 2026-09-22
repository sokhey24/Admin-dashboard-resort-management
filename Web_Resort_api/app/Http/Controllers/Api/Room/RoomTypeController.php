<?php

namespace App\Http\Controllers\Api\Room;

use App\Http\Controllers\Controller;
use App\Models\Room;
use App\Models\RoomType;
use App\Services\PricingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class RoomTypeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'page'      => 'sometimes|integer|min:1',
            'per_page'  => 'sometimes|integer|min:1|max:50',
            'search'    => 'nullable|string|max:255',
            'status'    => 'nullable|in:active,inactive',
            'sort'      => 'nullable|in:name,base_price,max_occupancy',
            'direction' => 'nullable|in:asc,desc',
            'resort_id' => 'nullable|exists:resorts,id',
        ]);

        $query = RoomType::query()->with('resort:id,name')->withCount('rooms');
        $search = trim((string) $request->input('search', ''));
        if ($search !== '') {
            $like = '%'.$search.'%';
            $query->where(function ($q) use ($like) {
                $q->where('name', 'like', $like)
                    ->orWhere('description', 'like', $like)
                    ->orWhere('bed_type', 'like', $like);
            });
        }
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }
        if ($request->filled('resort_id')) {
            $query->where('resort_id', $request->input('resort_id'));
        }
        if (str_contains($request->path(), 'customer/')) {
            $query->where('status', 'active');
        }
        $sort = $request->input('sort', 'name');
        $dir = $request->input('direction', 'asc') === 'desc' ? 'desc' : 'asc';
        $query->orderBy($sort, $dir);

        $paginator = $query->paginate((int) $request->input('per_page', 10));
        $payload = $paginator->toArray();
        $total = RoomType::count();
        $active = RoomType::where('status', 'active')->count();
        $payload['stats'] = [
            'total' => $total,
            'active' => $active,
            'inactive' => $total - $active,
            'rooms' => Room::count(),
            'avg_price' => round((float) RoomType::avg('base_price'), 2),
        ];
        return response()->json($payload);
    }

    public function show(RoomType $roomType): JsonResponse
    {
        return response()->json(['data' => $roomType->load('resort:id,name')->loadCount('rooms')]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $roomType = RoomType::create($data);
        return response()->json(['data' => $roomType->load('resort:id,name')->loadCount('rooms')], 201);
    }

    public function update(Request $request, RoomType $roomType): JsonResponse
    {
        $data = $this->validated($request, $roomType);
        $roomType->update($data);
        return response()->json(['data' => $roomType->fresh()->load('resort:id,name')->loadCount('rooms')]);
    }

    public function destroy(RoomType $roomType): JsonResponse
    {
        if ($roomType->rooms()->exists()) {
            return response()->json(['message' => 'This room type cannot be deleted while rooms are assigned to it.'], 409);
        }
        $roomType->delete();
        return response()->json(null, 204);
    }

    protected function validated(Request $request, ?RoomType $roomType = null): array
    {
        $nameRule = Rule::unique('room_types', 'name')->where(
            fn ($q) => $q->where('resort_id', $request->input('resort_id', $roomType?->resort_id))
        );
        if ($roomType) {
            $nameRule = $nameRule->ignore($roomType->id);
        }
        $data = $request->validate([
            'resort_id'     => ($roomType ? 'sometimes' : 'required').'|exists:resorts,id',
            'name'          => [($roomType ? 'sometimes' : 'required'), 'string', 'max:255', $nameRule],
            'description'   => 'nullable|string',
            'base_price'    => ($roomType ? 'sometimes' : 'required').'|numeric|min:0',
            'discount_percent' => array_merge(['nullable'], PricingService::DISCOUNT_RULES),
            'max_occupancy' => ($roomType ? 'sometimes' : 'required').'|integer|min:1|max:50',
            'bed_count'     => 'nullable|integer|min:1|max:20',
            'bed_type'      => 'nullable|string|max:100',
            'size_sqm'           => 'nullable|numeric|min:0',
            'amenities'          => 'nullable|array',
            'amenities.*'        => 'string|max:120',
            'breakfast_included' => 'nullable|boolean',
            'free_cancellation'  => 'nullable|boolean',
            'status'             => 'nullable|in:active,inactive',
        ]);

        foreach (['breakfast_included', 'free_cancellation'] as $flag) {
            if ($request->has($flag)) {
                $data[$flag] = filter_var($request->input($flag), FILTER_VALIDATE_BOOLEAN);
            }
        }

        // The column is NOT NULL; a cleared input means "no discount".
        if (array_key_exists('discount_percent', $data) && $data['discount_percent'] === null) {
            $data['discount_percent'] = 0;
        }

        return $data;
    }
}
