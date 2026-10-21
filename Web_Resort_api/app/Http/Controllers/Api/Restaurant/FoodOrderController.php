<?php

namespace App\Http\Controllers\Api\Restaurant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Restaurant\StoreGuestFoodOrderRequest;
use App\Http\Resources\FoodOrderResource;
use App\Models\FoodOrder;
use App\Models\RestaurantTable;
use App\Services\BranchAccessService;
use App\Services\RestaurantService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

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
        $this->authorize('view', $foodOrder);
        $this->assertOrderAccessible($request, $foodOrder);

        return response()->json($foodOrder->load(['orderItems', 'restaurantTable']));
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user?->isGuestAccount()) {
            $validated = Validator::make(
                $request->all(),
                (new StoreGuestFoodOrderRequest())->rules()
            )->validate();

            $result = $this->service->createGuestOrder($user, $validated);

            return response()->json([
                'success' => true,
                'data' => new FoodOrderResource($result['order']),
                'khqr' => $result['khqr'] ?? null,
            ], 201);
        }

        $request->validate([
            'table_id' => 'required|exists:restaurant_tables,id',
            'items' => 'required|array|min:1',
            'items.*.menu_item_id' => 'required|exists:menu_items,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        $table = RestaurantTable::findOrFail($request->input('table_id'));
        if ($table->branch_id) {
            $this->branchAccess->assertBranchAccessible($user, (int) $table->branch_id);
        }

        $order = $this->service->createOrder($request->all());

        return response()->json(new FoodOrderResource($order), 201);
    }

    public function update(Request $request, FoodOrder $foodOrder): JsonResponse
    {
        $this->authorize('update', $foodOrder);
        $this->assertOrderAccessible($request, $foodOrder);
        $order = $this->service->updateOrder($foodOrder, $request->all());

        return response()->json($order);
    }

    public function destroy(Request $request, FoodOrder $foodOrder): JsonResponse
    {
        $this->authorize('delete', $foodOrder);
        $this->assertOrderAccessible($request, $foodOrder);
        $foodOrder->delete();

        return response()->json(null, 204);
    }

    protected function assertOrderAccessible(Request $request, FoodOrder $foodOrder): void
    {
        $user = $request->user();

        if ($user?->isGuestAccount()) {
            if ((int) $foodOrder->user_id !== (int) $user->id) {
                abort(403, 'You cannot access this order.');
            }

            return;
        }

        $scoped = FoodOrder::query()->whereKey($foodOrder->id);
        $this->branchAccess->applyFoodOrderBranchScope(
            $scoped,
            $user,
            null
        );

        if (! $scoped->exists()) {
            abort(403, 'You cannot access data for this branch.');
        }
    }
}
