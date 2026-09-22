<?php

namespace App\Http\Controllers\Api\Resort;

use App\Http\Controllers\Controller;
use App\Http\Requests\Resort\IndexResortRequest;
use App\Models\Resort;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Services\ResortService;
use Illuminate\Support\Facades\Storage;

class ResortController extends Controller
{
    public function __construct(protected ResortService $service) {}

    public function index(IndexResortRequest $request): JsonResponse
    {
        $filters = $request->validated();

        if ($request->user() && str_contains($request->path(), 'admin/')) {
            $paginator = $this->service->paginateForAdmin($filters, $request->user());

            return response()->json($paginator);
        }

        $paginator = $this->service->paginateForCustomer($filters);

        return response()->json($paginator);
    }

    public function show(Resort $resort): JsonResponse
    {
        $payload = $resort->load(['branches', 'facilities']);
        $data = $payload->toArray();
        $data['logo_url'] = $resort->logo ? Storage::disk('public')->url($resort->logo) : null;
        $data['cover_image_url'] = $resort->cover_image
            ? Storage::disk('public')->url($resort->cover_image)
            : null;

        return response()->json(['data' => $data]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name'               => 'required|string|max:255',
            'slug'               => 'required|string|max:255|unique:resorts',
            'description'        => 'nullable|string',
            'resort_type'        => 'nullable|string|max:64',
            'stars'              => 'nullable|integer|min:1|max:5',
            'promo_tag'          => 'nullable|string|max:255',
            'tagline'            => 'nullable|string|max:255',
            'email'              => 'required|email|unique:resorts',
            'phone'              => 'required|string|max:20',
            'address'            => 'required|string',
            'city'               => 'required|string|max:255',
            'country'            => 'required|string|max:255',
            'website'            => 'nullable|url',
            'logo'               => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'cover_image'        => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:4096',
            'status'             => 'required|in:active,inactive',
            'free_cancellation'  => 'nullable|boolean',
            'breakfast_options'  => 'nullable|boolean',
            'featured'           => 'nullable|boolean',
        ]);

        $data = $request->only(
            'name', 'slug', 'description', 'resort_type', 'stars', 'promo_tag', 'tagline',
            'email', 'phone', 'address', 'city', 'country', 'website', 'status',
            'free_cancellation', 'breakfast_options', 'featured'
        );
        $data = $this->normalizeCatalogBooleans($data, $request);

        if ($request->hasFile('logo')) {
            $data['logo'] = $request->file('logo');
        }
        if ($request->hasFile('cover_image')) {
            $data['cover_image'] = $request->file('cover_image');
        }

        $result = $this->service->create($data);

        return response()->json([
            'message' => 'Resort created successfully',
            'resort'  => $result,
        ], 201);
    }

    public function update(Request $request, Resort $resort): JsonResponse
    {
        $request->validate([
            'name'               => 'sometimes|string|max:255',
            'slug'               => 'sometimes|string|max:255|unique:resorts,slug,' . $resort->id,
            'description'        => 'nullable|string',
            'resort_type'        => 'nullable|string|max:64',
            'stars'              => 'nullable|integer|min:1|max:5',
            'promo_tag'          => 'nullable|string|max:255',
            'tagline'            => 'nullable|string|max:255',
            'email'              => 'sometimes|email|unique:resorts,email,' . $resort->id,
            'phone'              => 'sometimes|string|max:20',
            'address'            => 'nullable|string',
            'city'               => 'nullable|string|max:255',
            'country'            => 'nullable|string|max:255',
            'website'            => 'nullable|url',
            'logo'               => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'cover_image'        => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:4096',
            'status'             => 'sometimes|in:active,inactive',
            'free_cancellation'  => 'nullable|boolean',
            'breakfast_options'  => 'nullable|boolean',
            'featured'           => 'nullable|boolean',
        ]);

        $data = $request->only(
            'name', 'slug', 'description', 'resort_type', 'stars', 'promo_tag', 'tagline',
            'email', 'phone', 'address', 'city', 'country', 'website', 'status',
            'free_cancellation', 'breakfast_options', 'featured'
        );
        $data = array_filter($data, fn ($v) => ! is_null($v));
        $data = $this->normalizeCatalogBooleans($data, $request);

        if ($request->hasFile('logo')) {
            $data['logo'] = $request->file('logo');
        }
        if ($request->hasFile('cover_image')) {
            $data['cover_image'] = $request->file('cover_image');
        }

        $fresh = $this->service->update($resort, $data);
        $result = $fresh->toArray();
        $result['logo_url'] = $fresh->logo ? Storage::disk('public')->url($fresh->logo) : null;
        $result['cover_image_url'] = $fresh->cover_image
            ? Storage::disk('public')->url($fresh->cover_image)
            : null;

        return response()->json([
            'message' => 'Resort updated successfully',
            'resort'  => $result,
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $resort = Resort::find($id);

        if (!$resort) {
            return response()->json(['message' => 'Resort not found!'], 404);
        }

        $this->service->delete($resort);

        return response()->json([
            'message' => 'Resort deleted successfully',
        ], 200);
    }

    /** @param  array<string, mixed>  $data */
    protected function normalizeCatalogBooleans(array $data, Request $request): array
    {
        foreach (['free_cancellation', 'breakfast_options', 'featured'] as $key) {
            if ($request->has($key)) {
                $data[$key] = filter_var($request->input($key), FILTER_VALIDATE_BOOLEAN);
            }
        }

        return $data;
    }
}
