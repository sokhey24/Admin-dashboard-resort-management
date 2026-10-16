<?php

namespace App\Http\Controllers\Api\Room;

use App\Http\Controllers\Controller;
use App\Models\Branch;
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
            'per_page'  => 'sometimes|integer|min:1|max:200',
            'assignable_to_branch' => 'sometimes|boolean',
            'search'    => 'nullable|string|max:255',
            'status'    => 'nullable|in:active,inactive',
            'sort'      => 'nullable|in:name,base_price,max_occupancy',
            'direction' => 'nullable|in:asc,desc',
            'resort_id' => 'nullable|exists:resorts,id',
            'branch_id' => 'nullable|exists:branches,id',
        ]);

        $query = RoomType::query()->with(['resort:id,name', 'branch:id,name,resort_id'])->withCount('rooms');
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
        if (str_contains($request->path(), 'admin/')) {
            app(\App\Services\ResortAccessService::class)->applyResortColumnScope(
                $query,
                $request->user(),
                'resort_id',
                $request->input('resort_id')
            );
            app(\App\Services\BranchAccessService::class)->applyBranchColumnScope(
                $query,
                $request->user(),
                'branch_id',
                $request->input('branch_id')
            );
        } elseif ($request->filled('resort_id')) {
            $query->where('resort_id', $request->input('resort_id'));
        }
        if ($request->filled('branch_id')) {
            $branchId = (int) $request->input('branch_id');
            if ($request->boolean('assignable_to_branch')) {
                $query->where(function ($q) use ($branchId) {
                    $q->where('branch_id', $branchId)->orWhereNull('branch_id');
                });
            } else {
                $query->where('branch_id', $branchId);
            }
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
        return response()->json(['data' => $roomType->load(['resort:id,name', 'branch:id,name,resort_id'])->loadCount('rooms')]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $roomType = RoomType::create($data);
        return response()->json(['data' => $roomType->load(['resort:id,name', 'branch:id,name,resort_id'])->loadCount('rooms')], 201);
    }

    public function update(Request $request, RoomType $roomType): JsonResponse
    {
        $data = $this->validated($request, $roomType);
        $roomType->update($data);
        return response()->json(['data' => $roomType->fresh()->load(['resort:id,name', 'branch:id,name,resort_id'])->loadCount('rooms')]);
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
        $resortIdForRule = $request->input('resort_id', $roomType?->resort_id);
        $branchIdForRule = $request->has('branch_id')
            ? $request->input('branch_id')
            : $roomType?->branch_id;

        $nameRule = Rule::unique('room_types', 'name');
        if ($branchIdForRule) {
            // Same name is allowed on different branches; not twice on one branch.
            $nameRule = $nameRule->where(fn ($q) => $q->where('branch_id', $branchIdForRule));
        } else {
            $nameRule = $nameRule->where(
                fn ($q) => $q->where('resort_id', $resortIdForRule)->whereNull('branch_id')
            );
        }
        if ($roomType) {
            $nameRule = $nameRule->ignore($roomType->id);
        }

        $data = $request->validate([
            'resort_id'     => ($roomType ? 'sometimes' : 'required').'|exists:resorts,id',
            'branch_id'     => 'nullable|exists:branches,id',
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

        $resortId = $data['resort_id'] ?? $roomType?->resort_id;
        $branchId = array_key_exists('branch_id', $data) ? $data['branch_id'] : $roomType?->branch_id;
        if ($branchId && $resortId) {
            $belongs = Branch::query()
                ->where('id', $branchId)
                ->where('resort_id', $resortId)
                ->exists();
            if (! $belongs) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'branch_id' => ['The selected branch does not belong to this resort.'],
                ]);
            }
        }
        if (! empty($branchId) && $request->user()) {
            app(\App\Services\BranchAccessService::class)->assertBranchAccessible($request->user(), (int) $branchId);
        }

        return $data;
    }
}
