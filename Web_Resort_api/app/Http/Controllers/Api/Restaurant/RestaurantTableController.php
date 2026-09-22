<?php

namespace App\Http\Controllers\Api\Restaurant;

use App\Http\Controllers\Controller;
use App\Models\RestaurantTable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RestaurantTableController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(RestaurantTable::all());
    }

    public function store(Request $request): JsonResponse
    {
        $table = RestaurantTable::create($request->all());
        return response()->json($table, 201);
    }

    public function update(Request $request, RestaurantTable $restaurantTable): JsonResponse
    {
        $restaurantTable->update($request->all());
        return response()->json($restaurantTable);
    }

    public function destroy(RestaurantTable $restaurantTable): JsonResponse
    {
        $restaurantTable->delete();
        return response()->json(null, 204);
    }
}
