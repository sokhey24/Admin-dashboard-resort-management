<?php

namespace App\Http\Controllers\Api\Restaurant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Restaurant\StoreMenuItemRequest;
use App\Http\Requests\Restaurant\UpdateMenuItemRequest;
use App\Http\Resources\MenuItemResource;
use App\Models\MenuItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MenuItemController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = MenuItem::query()->with('category');

        if ($this->isCustomerCatalog($request)) {
            $query->where('status', 'active')->where('is_available', true);
        }

        if ($request->filled('food_category_id')) {
            $query->where('food_category_id', (int) $request->input('food_category_id'));
        }

        $items = $query->orderBy('name')->get();

        return response()->json(MenuItemResource::collection($items)->resolve());
    }

    public function show(Request $request, MenuItem $menuItem): JsonResponse
    {
        $menuItem->load('category');

        if ($this->isCustomerCatalog($request) && $menuItem->status === 'inactive') {
            abort(404);
        }

        return response()->json((new MenuItemResource($menuItem))->resolve());
    }

    public function store(StoreMenuItemRequest $request): JsonResponse
    {
        $item = MenuItem::create($this->payloadFromRequest($request, false));

        return response()->json((new MenuItemResource($item->load('category')))->resolve(), 201);
    }

    public function update(UpdateMenuItemRequest $request, MenuItem $menuItem): JsonResponse
    {
        $payload = $this->payloadFromRequest($request, true);

        if (array_key_exists('image', $payload) && $menuItem->image && $payload['image'] !== $menuItem->image) {
            $this->deleteStoredImage($menuItem->image);
        }

        $menuItem->update($payload);

        return response()->json((new MenuItemResource($menuItem->fresh()->load('category')))->resolve());
    }

    public function destroy(MenuItem $menuItem): JsonResponse
    {
        $this->deleteStoredImage($menuItem->image);
        $menuItem->delete();

        return response()->json(null, 204);
    }

    protected function payloadFromRequest(Request $request, bool $isUpdate): array
    {
        $validated = $request->validated();

        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('menu', 'public');
        } elseif ($isUpdate && ! $request->exists('image')) {
            unset($validated['image']);
        }

        if (array_key_exists('is_available', $validated)) {
            $validated['is_available'] = filter_var(
                $validated['is_available'],
                FILTER_VALIDATE_BOOLEAN,
                FILTER_NULL_ON_FAILURE
            ) ?? (bool) $validated['is_available'];
        }

        return $validated;
    }

    protected function isCustomerCatalog(Request $request): bool
    {
        return $request->is('api/customer/*') || $request->is('customer/*');
    }

    protected function deleteStoredImage(?string $path): void
    {
        if (! $path || preg_match('#^https?://#i', $path)) {
            return;
        }

        Storage::disk('public')->delete($path);
    }
}
