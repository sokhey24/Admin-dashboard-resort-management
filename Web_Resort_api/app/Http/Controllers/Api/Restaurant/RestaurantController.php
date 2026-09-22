<?php

namespace App\Http\Controllers\Api\Restaurant;

use App\Http\Controllers\Controller;
use App\Models\Restaurant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class RestaurantController extends Controller
{
    public function index(): JsonResponse
    {
        $restaurants = Restaurant::with('resort:id,name')->get()->map(function ($r) {
            $r->logo_url = $r->logo ? Storage::disk('public')->url($r->logo) : null;
            return $r;
        });

        return response()->json(['data' => $restaurants]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'resort_id'   => 'required|exists:resorts,id',
            'name'        => 'required|string|max:255',
            'slug'        => 'required|string|max:255|unique:restaurants',
            'description' => 'nullable|string',
            'phone'       => 'nullable|string|max:20',
            'email'       => 'nullable|email',
            'address'     => 'nullable|string',
            'logo'        => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'status'      => 'required|in:active,inactive',
        ]);

        $data = $request->only('resort_id', 'name', 'slug', 'description', 'phone', 'email', 'address', 'status');

        if ($request->hasFile('logo')) {
            $data['logo'] = $request->file('logo')->store('restaurants/logos', 'public');
        }

        $restaurant = Restaurant::create($data);
        $restaurant->logo_url = $restaurant->logo ? Storage::disk('public')->url($restaurant->logo) : null;

        return response()->json(['message' => 'Restaurant created successfully', 'restaurant' => $restaurant], 201);
    }

    public function show(Restaurant $restaurant): JsonResponse
    {
        $restaurant->logo_url = $restaurant->logo ? Storage::disk('public')->url($restaurant->logo) : null;
        return response()->json($restaurant->load('resort:id,name'));
    }

    public function update(Request $request, Restaurant $restaurant): JsonResponse
    {
        $request->validate([
            'resort_id'   => 'sometimes|exists:resorts,id',
            'name'        => 'sometimes|string|max:255',
            'slug'        => 'sometimes|string|max:255|unique:restaurants,slug,' . $restaurant->id,
            'description' => 'nullable|string',
            'phone'       => 'nullable|string|max:20',
            'email'       => 'nullable|email',
            'address'     => 'nullable|string',
            'logo'        => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'status'      => 'sometimes|in:active,inactive',
        ]);

        $data = array_filter(
            $request->only('resort_id', 'name', 'slug', 'description', 'phone', 'email', 'address', 'status'),
            fn($v) => !is_null($v)
        );

        if ($request->hasFile('logo')) {
            if ($restaurant->logo) Storage::disk('public')->delete($restaurant->logo);
            $data['logo'] = $request->file('logo')->store('restaurants/logos', 'public');
        }

        $restaurant->update($data);
        $restaurant->logo_url = $restaurant->logo ? Storage::disk('public')->url($restaurant->logo) : null;

        return response()->json(['message' => 'Restaurant updated successfully', 'restaurant' => $restaurant]);
    }

    public function destroy(Restaurant $restaurant): JsonResponse
    {
        if ($restaurant->logo) Storage::disk('public')->delete($restaurant->logo);
        $restaurant->delete();

        return response()->json(['message' => 'Restaurant deleted successfully']);
    }
}
