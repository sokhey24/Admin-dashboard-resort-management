<?php

namespace App\Http\Controllers\Api\Restaurant;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\RestaurantTable;
use App\Services\BranchAccessService;
use App\Services\ResortAccessService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class RestaurantTableController extends Controller
{
    public function __construct(
        protected BranchAccessService $branchAccess,
        protected ResortAccessService $resortAccess,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = RestaurantTable::query()->with('branch:id,name');

        $this->resortAccess->applyResortColumnScope(
            $query,
            $request->user(),
            'resort_id',
            $request->input('resort_id')
        );

        if (Schema::hasColumn('restaurant_tables', 'branch_id')) {
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
            'resort_id'     => 'required|exists:resorts,id',
            'table_number'  => 'required|string|max:20|unique:restaurant_tables,table_number',
            'capacity'      => 'sometimes|integer|min:1',
            'location'      => 'nullable|string',
            'status'        => 'sometimes|in:available,occupied,reserved,maintenance',
        ];

        if (Schema::hasColumn('restaurant_tables', 'branch_id')) {
            $rules['branch_id'] = 'required|exists:branches,id';
        }

        $validated = $request->validate($rules);
        $this->assertBranchForResort($validated);

        if (! empty($validated['branch_id'])) {
            $this->branchAccess->assertBranchAccessible($request->user(), (int) $validated['branch_id']);
        }

        $table = RestaurantTable::create($validated);

        return response()->json($table->load('branch:id,name'), 201);
    }

    public function update(Request $request, RestaurantTable $restaurantTable): JsonResponse
    {
        $this->assertTableAccessible($request, $restaurantTable);

        $rules = [
            'resort_id'     => 'sometimes|exists:resorts,id',
            'table_number'  => 'sometimes|string|max:20|unique:restaurant_tables,table_number,'.$restaurantTable->id,
            'capacity'      => 'sometimes|integer|min:1',
            'location'      => 'nullable|string',
            'status'        => 'sometimes|in:available,occupied,reserved,maintenance',
        ];

        if (Schema::hasColumn('restaurant_tables', 'branch_id')) {
            $rules['branch_id'] = 'sometimes|exists:branches,id';
        }

        $validated = $request->validate($rules);
        $merged = array_merge($restaurantTable->only(['resort_id', 'branch_id']), $validated);
        $this->assertBranchForResort($merged);

        if (isset($validated['branch_id'])) {
            $this->branchAccess->assertBranchAccessible($request->user(), (int) $validated['branch_id']);
        }

        $restaurantTable->update($validated);

        return response()->json($restaurantTable->fresh()->load('branch:id,name'));
    }

    public function destroy(Request $request, RestaurantTable $restaurantTable): JsonResponse
    {
        $this->assertTableAccessible($request, $restaurantTable);
        $restaurantTable->delete();

        return response()->json(null, 204);
    }

    protected function assertTableAccessible(Request $request, RestaurantTable $table): void
    {
        if ($request->user() && ! $this->resortAccess->bypassesResortScope($request->user())) {
            $assigned = $this->resortAccess->assignedResortIds($request->user());
            if ($assigned === [] || ! in_array((int) $table->resort_id, $assigned, true)) {
                abort(403, 'You cannot access data for this resort.');
            }
        }

        if ($table->branch_id) {
            $this->branchAccess->assertBranchAccessible($request->user(), (int) $table->branch_id);
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
