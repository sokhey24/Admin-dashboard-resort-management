<?php

namespace App\Http\Controllers\Api\Resort;

use App\Http\Controllers\Controller;
use App\Models\Facility;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FacilityController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = Facility::query();
        app(\App\Services\ResortAccessService::class)->applyResortColumnScope($q, $request->user());

        return response()->json($q->get());
    }

    public function show(Facility $facility): JsonResponse
    {
        return response()->json($facility);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'resort_id'   => 'required|exists:resorts,id',
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
            'icon'        => 'nullable|string|max:255',
            'status'      => 'nullable|in:active,inactive',
        ]);
        $facility = Facility::create($data);
        return response()->json($facility, 201);
    }

    public function update(Request $request, Facility $facility): JsonResponse
    {
        $data = $request->validate([
            'resort_id'   => 'sometimes|exists:resorts,id',
            'name'        => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'icon'        => 'nullable|string|max:255',
            'status'      => 'nullable|in:active,inactive',
        ]);
        $facility->update($data);
        return response()->json($facility);
    }

    public function destroy(Facility $facility): JsonResponse
    {
        $facility->delete();
        return response()->json(null, 204);
    }
}
