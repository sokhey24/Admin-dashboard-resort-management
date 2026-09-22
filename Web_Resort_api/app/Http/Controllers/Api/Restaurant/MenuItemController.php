<?php

namespace App\Http\Controllers\Api\Restaurant;

use App\Http\Controllers\Controller;
use App\Models\MenuItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MenuItemController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(MenuItem::with('category')->get());
    }

    public function show(MenuItem $menuItem): JsonResponse
    {
        return response()->json($menuItem->load('category'));
    }

    public function store(Request $request): JsonResponse
    {
        $item = MenuItem::create($request->all());
        return response()->json($item, 201);
    }

    public function update(Request $request, MenuItem $menuItem): JsonResponse
    {
        $menuItem->update($request->all());
        return response()->json($menuItem);
    }

    public function destroy(MenuItem $menuItem): JsonResponse
    {
        $menuItem->delete();
        return response()->json(null, 204);
    }
}
