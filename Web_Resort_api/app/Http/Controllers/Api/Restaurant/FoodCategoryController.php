<?php

namespace App\Http\Controllers\Api\Restaurant;

use App\Http\Controllers\Controller;
use App\Models\FoodCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FoodCategoryController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(FoodCategory::all());
    }

    public function store(Request $request): JsonResponse
    {
        $category = FoodCategory::create($request->all());
        return response()->json($category, 201);
    }

    public function update(Request $request, FoodCategory $foodCategory): JsonResponse
    {
        $foodCategory->update($request->all());
        return response()->json($foodCategory);
    }

    public function destroy(FoodCategory $foodCategory): JsonResponse
    {
        $foodCategory->delete();
        return response()->json(null, 204);
    }
}
