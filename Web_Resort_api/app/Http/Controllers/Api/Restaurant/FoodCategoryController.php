<?php

namespace App\Http\Controllers\Api\Restaurant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Restaurant\StoreFoodCategoryRequest;
use App\Http\Resources\FoodCategoryResource;
use App\Models\Branch;
use App\Models\FoodCategory;
use App\Services\BranchAccessService;
use App\Services\ResortAccessService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class FoodCategoryController extends Controller
{
    public function __construct(
        protected BranchAccessService $branchAccess,
        protected ResortAccessService $resortAccess,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = FoodCategory::query()
            ->with('branch:id,name')
            ->withCount('menuItems');

        if ($this->isCustomerCatalog($request)) {
            $query->where('status', 'active');
        } else {
            $this->resortAccess->applyResortColumnScope(
                $query,
                $request->user(),
                'resort_id',
                $request->input('resort_id')
            );
            $this->branchAccess->applyBranchColumnScope(
                $query,
                $request->user(),
                'branch_id',
                $request->input('branch_id')
            );
        }

        $categories = $query->orderBy('name')->get();

        return response()->json(FoodCategoryResource::collection($categories)->resolve());
    }

    public function show(Request $request, FoodCategory $foodCategory): JsonResponse
    {
        if (! $this->isCustomerCatalog($request)) {
            $this->assertCategoryAccessible($request, $foodCategory);
        }

        return response()->json(
            (new FoodCategoryResource($foodCategory->load('branch:id,name')->loadCount('menuItems')))->resolve()
        );
    }

    public function store(StoreFoodCategoryRequest $request): JsonResponse
    {
        $validated = $request->validated();
        unset($validated['image']);
        $this->assertBranchForResort($validated);

        if (! empty($validated['branch_id'])) {
            $this->branchAccess->assertBranchAccessible($request->user(), (int) $validated['branch_id']);
        }

        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('food-categories', 'public');
        }

        $category = FoodCategory::create($validated);

        return response()->json(
            (new FoodCategoryResource($category->load('branch:id,name')->loadCount('menuItems')))->resolve(),
            201
        );
    }

    public function update(Request $request, FoodCategory $foodCategory): JsonResponse
    {
        $this->assertCategoryAccessible($request, $foodCategory);

        $validated = $this->validatedPayload($request, true);
        $merged = array_merge($foodCategory->only(['resort_id', 'branch_id']), $validated);
        $this->assertBranchForResort($merged);

        if (isset($validated['branch_id'])) {
            $this->branchAccess->assertBranchAccessible($request->user(), (int) $validated['branch_id']);
        }

        if ($request->hasFile('image')) {
            $this->deleteStoredImage($foodCategory->image);
            $validated['image'] = $request->file('image')->store('food-categories', 'public');
        }

        $foodCategory->update($validated);

        return response()->json($foodCategory->fresh()->load('branch:id,name')->loadCount('menuItems'));
    }

    public function destroy(Request $request, FoodCategory $foodCategory): JsonResponse
    {
        $this->assertCategoryAccessible($request, $foodCategory);

        if ($foodCategory->menuItems()->exists()) {
            throw ValidationException::withMessages([
                'food_category' => ['Cannot delete a category that still has menu items. Move or delete those items first.'],
            ]);
        }

        $this->deleteStoredImage($foodCategory->image);
        $foodCategory->delete();

        return response()->json(null, 204);
    }

    protected function validatedPayload(Request $request, bool $isUpdate): array
    {
        $required = $isUpdate ? 'sometimes' : 'required';

        $rules = [
            'resort_id' => $required.'|exists:resorts,id',
            'branch_id' => $required.'|exists:branches,id',
            'name' => $required.'|string|max:255',
            'status' => 'sometimes|in:active,inactive',
        ];

        if ($request->hasFile('image')) {
            $rules['image'] = 'image|max:2048';
        }

        $validated = $request->validate($rules);
        unset($validated['image']);

        return $validated;
    }

    protected function isCustomerCatalog(Request $request): bool
    {
        return $request->is('api/customer/*') || $request->is('customer/*');
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

    protected function deleteStoredImage(?string $path): void
    {
        if (! $path || preg_match('#^https?://#i', $path)) {
            return;
        }

        Storage::disk('public')->delete($path);
    }
}
