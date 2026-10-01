<?php

namespace App\Http\Controllers\Api\Restaurant;

use App\Http\Controllers\Controller;
use App\Models\FoodOrder;
use App\Models\RestaurantTable;
use App\Services\BranchAccessService;
use App\Services\RestaurantService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FoodOrderController extends Controller
{
    public function __construct(
        protected RestaurantService $service,
        protected BranchAccessService $branchAccess,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = FoodOrder::query()->with(['orderItems', 'restaurantTable.branch:id,name', 'branch:id,name']);

        $this->branchAccess->applyFoodOrderBranchScope(
            $query,
            $request->user(),
            $request->input('branch_id')
        );

        return response()->json(['data' => $query->get()]);
    }

    public function show(Request $request, FoodOrder $foodOrder): JsonResponse
    {
        $this->assertOrderAccessible($request, $foodOrder);

        return response()->json($foodOrder->load(['orderItems', 'restaurantTable']));
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'table_id'              => 'required|exists:restaurant_tables,id',
            'items'                 => 'required|array|min:1',
            'items.*.menu_item_id'  => 'required|exists:menu_items,id',
            'items.*.quantity'      => 'required|integer|min:1',
        ]);

        $table = RestaurantTable::findOrFail($request->input('table_id'));
        if ($table->branch_id) {
            $this->branchAccess->assertBranchAccessible($request->user(), (int) $table->branch_id);
        }

        $order = $this->service->createOrder($request->all());

        return response()->json($order, 201);
    }

    public function update(Request $request, FoodOrder $foodOrder): JsonResponse
    {
        $this->assertOrderAccessible($request, $foodOrder);
        $order = $this->service->updateOrder($foodOrder, $request->all());

        return response()->json($order);
    }

    public function destroy(Request $request, FoodOrder $foodOrder): JsonResponse
    {
        $this->assertOrderAccessible($request, $foodOrder);
        $foodOrder->delete();

        return response()->json(null, 204);
    }

    protected function assertOrderAccessible(Request $request, FoodOrder $foodOrder): void
    {
        $scoped = FoodOrder::query()->whereKey($foodOrder->id);
        $this->branchAccess->applyFoodOrderBranchScope(
            $scoped,
            $request->user(),
            null
        );

        if (! $scoped->exists()) {
            abort(403, 'You cannot access data for this branch.');
        }
    }
}
