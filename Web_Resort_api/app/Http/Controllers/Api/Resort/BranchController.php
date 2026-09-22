<?php

namespace App\Http\Controllers\Api\Resort;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BranchController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['data' => Branch::with('resort')->get()]);
    }

    public function show(Branch $branch): JsonResponse
    {
        return response()->json($branch->load('resort'));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'resort_id'    => 'required|exists:resorts,id',
            'name'         => 'required|string|max:255',
            'address'      => 'required|string|max:500',
            'phone'        => 'nullable|string|max:20',
            'manager_name' => 'nullable|string|max:255',
            'status'       => 'required|in:active,inactive',
        ]);
        $branch = Branch::create($data);
        return response()->json(['data' => $branch], 201);
    }

    public function update(Request $request, Branch $branch): JsonResponse
    {
        $data = $request->validate([
            'resort_id'    => 'sometimes|exists:resorts,id',
            'name'         => 'sometimes|string|max:255',
            'address'      => 'sometimes|string|max:500',
            'phone'        => 'nullable|string|max:20',
            'manager_name' => 'nullable|string|max:255',
            'status'       => 'sometimes|in:active,inactive',
        ]);
        $branch->update($data);
        return response()->json(['data' => $branch]);
    }

    public function destroy(Branch $branch): JsonResponse
    {
        $branch->delete();
        return response()->json(null, 204);
    }
}
