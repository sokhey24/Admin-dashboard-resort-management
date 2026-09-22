<?php

namespace App\Http\Controllers\Api\Restaurant;

use App\Http\Controllers\Controller;
use App\Models\FoodOrder;
use App\Services\RestaurantService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FoodOrderController extends Controller
{
    public function __construct(protected RestaurantService $service) {}

    public function index(): JsonResponse
    {
        return response()->json(['data' => FoodOrder::with(['orderItems', 'restaurantTable'])->get()]);
    }

    public function show(FoodOrder $foodOrder): JsonResponse
    {
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

        $order = $this->service->createOrder($request->all());
        return response()->json($order, 201);
    }

    public function update(Request $request, FoodOrder $foodOrder): JsonResponse
    {
        $order = $this->service->updateOrder($foodOrder, $request->all());
        return response()->json($order);
    }

    public function destroy(FoodOrder $foodOrder): JsonResponse
    {
        $foodOrder->delete();
        return response()->json(null, 204);
    }
}
