<?php

namespace App\Http\Controllers\Api\Restaurant;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Restaurant;
use App\Services\BranchAccessService;
use App\Services\ResortAccessService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class RestaurantController extends Controller
{
    public function __construct(
        protected BranchAccessService $branchAccess,
        protected ResortAccessService $resortAccess,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = Restaurant::query()->with(['resort:id,name', 'branch:id,name']);

        $this->resortAccess->applyResortColumnScope(
            $query,
            $request->user(),
            'resort_id',
            $request->input('resort_id')
        );

        if (Schema::hasColumn('restaurants', 'branch_id')) {
            $this->branchAccess->applyBranchColumnScope(
                $query,
                $request->user(),
                'branch_id',
                $request->input('branch_id')
            );
        }

        $restaurants = $query->get()->map(function ($r) {
            $r->logo_url = $r->logo ? Storage::disk('public')->url($r->logo) : null;

            return $r;
        });

        return response()->json(['data' => $restaurants]);
    }

    public function store(Request $request): JsonResponse
    {
        $rules = [
            'resort_id'   => 'required|exists:resorts,id',
            'name'        => 'required|string|max:255',
            'slug'        => 'required|string|max:255|unique:restaurants',
            'description' => 'nullable|string',
            'phone'       => 'nullable|string|max:20',
            'email'       => 'nullable|email',
            'address'     => 'nullable|string',
            'logo'        => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'status'      => 'required|in:active,inactive',
        ];

        if (Schema::hasColumn('restaurants', 'branch_id')) {
            $rules['branch_id'] = 'required|exists:branches,id';
        }

        $request->validate($rules);

        $data = $request->only('resort_id', 'branch_id', 'name', 'slug', 'description', 'phone', 'email', 'address', 'status');
        $this->assertBranchForResort($data);

        if ($request->filled('branch_id')) {
            $this->branchAccess->assertBranchAccessible($request->user(), (int) $request->input('branch_id'));
        }

        if ($request->hasFile('logo')) {
            $data['logo'] = $request->file('logo')->store('restaurants/logos', 'public');
        }

        $restaurant = Restaurant::create($data);
        $restaurant->logo_url = $restaurant->logo ? Storage::disk('public')->url($restaurant->logo) : null;

        return response()->json(['message' => 'Restaurant created successfully', 'restaurant' => $restaurant], 201);
    }

    public function show(Request $request, Restaurant $restaurant): JsonResponse
    {
        $this->assertRestaurantAccessible($request, $restaurant);
        $restaurant->logo_url = $restaurant->logo ? Storage::disk('public')->url($restaurant->logo) : null;

        return response()->json($restaurant->load(['resort:id,name', 'branch:id,name']));
    }

    public function update(Request $request, Restaurant $restaurant): JsonResponse
    {
        $this->assertRestaurantAccessible($request, $restaurant);

        $rules = [
            'resort_id'   => 'sometimes|exists:resorts,id',
            'name'        => 'sometimes|string|max:255',
            'slug'        => 'sometimes|string|max:255|unique:restaurants,slug,' . $restaurant->id,
            'description' => 'nullable|string',
            'phone'       => 'nullable|string|max:20',
            'email'       => 'nullable|email',
            'address'     => 'nullable|string',
            'logo'        => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'status'      => 'sometimes|in:active,inactive',
        ];

        if (Schema::hasColumn('restaurants', 'branch_id')) {
            $rules['branch_id'] = 'sometimes|exists:branches,id';
        }

        $request->validate($rules);

        $data = array_filter(
            $request->only('resort_id', 'branch_id', 'name', 'slug', 'description', 'phone', 'email', 'address', 'status'),
            fn ($v) => ! is_null($v)
        );

        $merged = array_merge($restaurant->only(['resort_id', 'branch_id']), $data);
        $this->assertBranchForResort($merged);

        if (isset($data['branch_id'])) {
            $this->branchAccess->assertBranchAccessible($request->user(), (int) $data['branch_id']);
        }

        if ($request->hasFile('logo')) {
            if ($restaurant->logo) {
                Storage::disk('public')->delete($restaurant->logo);
            }
            $data['logo'] = $request->file('logo')->store('restaurants/logos', 'public');
        }

        $restaurant->update($data);
        $restaurant->logo_url = $restaurant->logo ? Storage::disk('public')->url($restaurant->logo) : null;

        return response()->json(['message' => 'Restaurant updated successfully', 'restaurant' => $restaurant]);
    }

    public function destroy(Request $request, Restaurant $restaurant): JsonResponse
    {
        $this->assertRestaurantAccessible($request, $restaurant);

        if ($restaurant->logo) {
            Storage::disk('public')->delete($restaurant->logo);
        }
        $restaurant->delete();

        return response()->json(['message' => 'Restaurant deleted successfully']);
    }

    protected function assertRestaurantAccessible(Request $request, Restaurant $restaurant): void
    {
        if ($request->user() && ! $this->resortAccess->bypassesResortScope($request->user())) {
            $assigned = $this->resortAccess->assignedResortIds($request->user());
            if ($assigned === [] || ! in_array((int) $restaurant->resort_id, $assigned, true)) {
                abort(403, 'You cannot access data for this resort.');
            }
        }

        if ($restaurant->branch_id) {
            $this->branchAccess->assertBranchAccessible($request->user(), (int) $restaurant->branch_id);
        }
    }

    /** @param  array<string, mixed>  $data */
    protected function assertBranchForResort(array $data): void
    {
        $resortId = $data['resort_id'] ?? null;
        $branchId = $data['branch_id'] ?? null;

        if (! $branchId || ! $resortId) {
            return;
        }

        $belongs = Branch::query()
            ->where('id', $branchId)
            ->where('resort_id', $resortId)
            ->exists();

        if (! $belongs) {
            throw ValidationException::withMessages([
                'branch_id' => ['The selected branch does not belong to this resort.'],
            ]);
        }
    }
}
