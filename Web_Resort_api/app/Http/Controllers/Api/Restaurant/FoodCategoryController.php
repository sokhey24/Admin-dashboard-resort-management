<?php

namespace App\Http\Controllers\Api\Restaurant;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\FoodCategory;
use App\Services\BranchAccessService;
use App\Services\ResortAccessService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class FoodCategoryController extends Controller
{
    public function __construct(
        protected BranchAccessService $branchAccess,
        protected ResortAccessService $resortAccess,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = FoodCategory::query()->with('branch:id,name');

        $this->resortAccess->applyResortColumnScope(
            $query,
            $request->user(),
            'resort_id',
            $request->input('resort_id')
        );

        if (Schema::hasColumn('food_categories', 'branch_id')) {
            $this->branchAccess->applyBranchColumnScope(
                $query,
                $request->user(),
                'branch_id',
                $request->input('branch_id')
            );
        }

        return response()->json($query->get());
    }

    public function store(Request $request): JsonResponse
    {
        $rules = [
            'resort_id'   => 'required|exists:resorts,id',
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
        ];

        if (Schema::hasColumn('food_categories', 'branch_id')) {
            $rules['branch_id'] = 'required|exists:branches,id';
        }

        $validated = $request->validate($rules);
        $this->assertBranchForResort($validated);

        if (! empty($validated['branch_id'])) {
            $this->branchAccess->assertBranchAccessible($request->user(), (int) $validated['branch_id']);
        }

        $category = FoodCategory::create($validated);

        return response()->json($category->load('branch:id,name'), 201);
    }

    public function update(Request $request, FoodCategory $foodCategory): JsonResponse
    {
        $this->assertCategoryAccessible($request, $foodCategory);

        $rules = [
            'resort_id'   => 'sometimes|exists:resorts,id',
            'name'        => 'sometimes|string|max:255',
            'description' => 'nullable|string',
        ];

        if (Schema::hasColumn('food_categories', 'branch_id')) {
            $rules['branch_id'] = 'sometimes|exists:branches,id';
        }

        $validated = $request->validate($rules);
        $merged = array_merge($foodCategory->only(['resort_id', 'branch_id']), $validated);
        $this->assertBranchForResort($merged);

        if (isset($validated['branch_id'])) {
            $this->branchAccess->assertBranchAccessible($request->user(), (int) $validated['branch_id']);
        }

        $foodCategory->update($validated);

        return response()->json($foodCategory->fresh()->load('branch:id,name'));
    }

    public function destroy(Request $request, FoodCategory $foodCategory): JsonResponse
    {
        $this->assertCategoryAccessible($request, $foodCategory);
        $foodCategory->delete();

        return response()->json(null, 204);
    }

    protected function assertCategoryAccessible(Request $request, FoodCategory $category): void
    {
        if ($request->user() && ! $this->resortAccess->bypassesResortScope($request->user())) {
            $assigned = $this->resortAccess->assignedResortIds($request->user());
            if ($assigned === [] || ! in_array((int) $category->resort_id, $assigned, true)) {
                abort(403, 'You cannot access data for this resort.');
            }
        }

        if ($category->branch_id) {
            $this->branchAccess->assertBranchAccessible($request->user(), (int) $category->branch_id);
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
