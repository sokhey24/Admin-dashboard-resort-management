<?php

namespace App\Http\Controllers\Api\Resort;

use App\Http\Controllers\Controller;
use App\Models\Resort;
use App\Services\ResortService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * Single brand settings controller (Solara Resort Corporate Identity & Master Settings).
 * Handles global brand configuration for the entire resort organization.
 */
class ResortProfileController extends Controller
{
    public function __construct(protected ResortService $service) {}

    public function show(): JsonResponse
    {
        $resort = Resort::getBrand();
        if (! $resort) {
            return response()->json(['message' => 'Resort brand settings are not configured.'], 404);
        }

        $resort->load(['facilities', 'branches']);

        return response()->json([
            'success' => true,
            'data'    => $this->format($resort),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $resort = Resort::getBrand() ?? Resort::query()->orderBy('id')->firstOrFail();

        $request->validate([
            'name'                 => 'sometimes|string|max:255',
            'brand_name'           => 'sometimes|string|max:255',
            'slug'                 => 'sometimes|string|max:255|unique:resorts,slug,'.$resort->id,
            'description'          => 'nullable|string',
            'resort_type'          => 'nullable|string|max:64',
            'stars'                => 'nullable|integer|min:1|max:5',
            'promo_tag'            => 'nullable|string|max:255',
            'tagline'              => 'nullable|string|max:255',
            'email'                => 'sometimes|email|unique:resorts,email,'.$resort->id,
            'central_email'        => 'nullable|email|max:255',
            'phone'                => 'sometimes|string|max:50',
            'central_phone'        => 'nullable|string|max:50',
            'address'              => 'nullable|string',
            'city'                 => 'nullable|string|max:255',
            'country'              => 'nullable|string|max:255',
            'website'              => 'nullable|url',
            'logo'                 => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:2048',
            'favicon'              => 'nullable|image|mimes:ico,png,svg,webp|max:1024',
            'cover_image'          => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:4096',
            'status'               => 'sometimes|in:active,inactive',
            'terms_and_conditions' => 'nullable|string',
            'free_cancellation'    => 'nullable|boolean',
            'breakfast_options'    => 'nullable|boolean',
            'featured'             => 'nullable|boolean',
        ]);

        $data = $request->only([
            'name', 'brand_name', 'slug', 'description', 'resort_type', 'stars', 'promo_tag', 'tagline',
            'email', 'central_email', 'phone', 'central_phone', 'address', 'city', 'country', 'website',
            'status', 'terms_and_conditions', 'free_cancellation', 'breakfast_options', 'featured',
        ]);

        if ($request->hasFile('logo')) {
            $data['logo'] = $request->file('logo');
        }
        if ($request->hasFile('favicon')) {
            $path = $request->file('favicon')->store('resorts/favicons', 'public');
            $data['favicon'] = $path;
        }
        if ($request->hasFile('cover_image')) {
            $data['cover_image'] = $request->file('cover_image');
        }

        // If brand_name passed, sync with name if name not passed
        if (! empty($data['brand_name']) && empty($data['name'])) {
            $data['name'] = $data['brand_name'];
        }

        $updated = $this->service->update($resort, array_filter($data, fn ($v) => ! is_null($v)));

        return response()->json([
            'success' => true,
            'message' => 'Resort brand settings updated successfully.',
            'data'    => $this->format($updated->load(['facilities', 'branches'])),
        ]);
    }

    protected function format(Resort $resort): array
    {
        $data = $resort->toArray();
        $data['brand_name'] = $resort->brand_name;
        $data['central_phone'] = $resort->central_phone;
        $data['central_email'] = $resort->central_email;
        $data['logo_url'] = $resort->logo ? Storage::disk('public')->url($resort->logo) : null;
        $data['favicon_url'] = $resort->favicon ? Storage::disk('public')->url($resort->favicon) : null;
        $data['cover_image_url'] = $resort->cover_image
            ? Storage::disk('public')->url($resort->cover_image)
            : null;

        return $data;
    }
}
