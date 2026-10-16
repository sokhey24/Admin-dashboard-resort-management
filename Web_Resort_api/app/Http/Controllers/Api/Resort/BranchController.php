<?php

namespace App\Http\Controllers\Api\Resort;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Services\BranchAccessService;
use App\Services\BranchService;
use App\Services\RoomService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class BranchController extends Controller
{
    public function __construct(
        protected BranchService $branches,
        protected RoomService $rooms,
    ) {}

    public function index(Request $request): JsonResponse
    {
        if (str_contains($request->path(), 'customer/')) {
            $paginator = $this->branches->paginateForCustomer($request->all());

            return response()->json($paginator);
        }

        $paginator = $this->branches->paginateForAdmin($request->all(), $request->user());

        return response()->json($paginator);
    }

    public function show(Request $request, Branch $branch): JsonResponse
    {
        if (str_contains($request->path(), 'customer/')) {
            if ($branch->status !== 'active' && (! $branch->is_active)) {
                abort(404, 'Branch not found or inactive.');
            }

            return response()->json(['data' => $this->branches->formatBranchDetail($branch)]);
        }

        app(BranchAccessService::class)->assertBranchAccessible($request->user(), (int) $branch->id);

        $branch->load(['resort.facilities']);
        $metrics = $this->branches->formatBranchRow($branch, []);

        return response()->json(['data' => $metrics]);
    }

    public function rooms(Request $request, Branch $branch): JsonResponse
    {
        if ($branch->status !== 'active' && str_contains($request->path(), 'customer/')) {
            abort(404);
        }

        if (! str_contains($request->path(), 'customer/')) {
            app(BranchAccessService::class)->assertBranchAccessible($request->user(), (int) $branch->id);
        }

        $filters = array_merge($request->all(), [
            'branch_id' => $branch->id,
            'resort_id' => $branch->resort_id,
            'active_resorts_only' => str_contains($request->path(), 'customer/'),
        ]);

        $paginator = $this->rooms->paginate($filters, $request->user());

        if (
            ! empty($filters['check_in'])
            && ! empty($filters['check_out'])
            && ! empty($filters['include_booked'])
        ) {
            $checkIn = \Carbon\Carbon::parse($filters['check_in'])->startOfDay();
            $checkOut = \Carbon\Carbon::parse($filters['check_out'])->startOfDay();
            $this->rooms->attachStayAvailability(
                $paginator->getCollection(),
                $checkIn,
                $checkOut,
                isset($filters['exclude_booking_id']) ? (int) $filters['exclude_booking_id'] : null
            );
        }

        return response()->json($paginator);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'resort_id'    => 'required|exists:resorts,id',
            'name'         => 'required|string|max:255',
            'slug'         => 'nullable|string|max:255',
            'city'         => 'nullable|string|max:255',
            'address'      => 'required|string|max:500',
            'description'    => 'nullable|string|max:5000',
            'description_km' => 'nullable|string|max:5000',
            'phone'        => 'nullable|string|max:20',
            'email'        => 'nullable|email|max:255',
            'cover_image'  => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:4096',
            'latitude'     => 'nullable|numeric|between:-90,90',
            'longitude'    => 'nullable|numeric|between:-180,180',
            'stars'        => 'nullable|integer|min:1|max:5',
            'manager_name' => 'nullable|string|max:255',
            'status'       => 'required|in:active,inactive,maintenance',
            'amenities'    => 'nullable|array',
            'amenities.*'  => 'string|max:120',
        ]);

        if ($request->hasFile('cover_image')) {
            $data['cover_image'] = $request->file('cover_image')->store('branches/covers', 'public');
        }

        $branch = Branch::create($data);

        return response()->json(['data' => $this->branches->formatBranchRow($branch->load('resort'))], 201);
    }

    public function update(Request $request, Branch $branch): JsonResponse
    {
        app(BranchAccessService::class)->assertBranchAccessible($request->user(), (int) $branch->id);

        $data = $request->validate([
            'resort_id'    => 'sometimes|exists:resorts,id',
            'name'         => 'sometimes|string|max:255',
            'slug'         => 'nullable|string|max:255',
            'city'         => 'nullable|string|max:255',
            'address'      => 'sometimes|string|max:500',
            'description'    => 'nullable|string|max:5000',
            'description_km' => 'nullable|string|max:5000',
            'phone'        => 'nullable|string|max:20',
            'email'        => 'nullable|email|max:255',
            'cover_image'  => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:4096',
            'latitude'     => 'nullable|numeric|between:-90,90',
            'longitude'    => 'nullable|numeric|between:-180,180',
            'stars'        => 'nullable|integer|min:1|max:5',
            'manager_name' => 'nullable|string|max:255',
            'status'       => 'sometimes|in:active,inactive,maintenance',
            'amenities'    => 'nullable|array',
            'amenities.*'  => 'string|max:120',
        ]);

        if ($request->hasFile('cover_image')) {
            if ($branch->cover_image) {
                Storage::disk('public')->delete($branch->cover_image);
            }
            $data['cover_image'] = $request->file('cover_image')->store('branches/covers', 'public');
        }

        $branch->update($data);

        return response()->json(['data' => $this->branches->formatBranchRow($branch->fresh()->load('resort'))]);
    }

    public function destroy(Branch $branch): JsonResponse
    {
        if ($branch->cover_image) {
            Storage::disk('public')->delete($branch->cover_image);
        }
        $branch->delete();

        return response()->json(null, 204);
    }
}
