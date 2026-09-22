<?php

namespace App\Http\Controllers\Api\User;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoleController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['data' => Role::with('permissions')->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'         => 'required|string|unique:roles,name',
            'display_name' => 'nullable|string|max:255',
            'description'  => 'nullable|string|max:500',
        ]);
        $role = Role::create($validated);
        return response()->json(['data' => $role], 201);
    }

    public function show(Role $role): JsonResponse
    {
        return response()->json(['data' => $role->load('permissions')]);
    }

    public function update(Request $request, Role $role): JsonResponse
    {
        $validated = $request->validate([
            'name'         => 'required|string|unique:roles,name,' . $role->id,
            'display_name' => 'nullable|string|max:255',
            'description'  => 'nullable|string|max:500',
        ]);
        $role->update($validated);
        return response()->json(['data' => $role]);
    }

    public function destroy(Role $role): JsonResponse
    {
        $role->delete();
        return response()->json(null, 204);
    }

    public function assignPermissions(Request $request, Role $role): JsonResponse
    {
        $request->validate(['permissions' => 'required|array', 'permissions.*' => 'exists:permissions,id']);
        $role->permissions()->syncWithoutDetaching($request->permissions);
        return response()->json(['data' => $role->load('permissions')]);
    }

    public function revokePermissions(Request $request, Role $role): JsonResponse
    {
        $request->validate(['permissions' => 'required|array', 'permissions.*' => 'exists:permissions,id']);
        $role->permissions()->detach($request->permissions);
        return response()->json(['data' => $role->load('permissions')]);
    }
}
