<?php

namespace App\Http\Controllers\Api\Resort;

use App\Http\Controllers\Controller;
use App\Models\Facility;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FacilityController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Facility::all());
    }

    public function store(Request $request): JsonResponse
    {
        $facility = Facility::create($request->all());
        return response()->json($facility, 201);
    }

    public function update(Request $request, Facility $facility): JsonResponse
    {
        $facility->update($request->all());
        return response()->json($facility);
    }

    public function destroy(Facility $facility): JsonResponse
    {
        $facility->delete();
        return response()->json(null, 204);
    }
}
