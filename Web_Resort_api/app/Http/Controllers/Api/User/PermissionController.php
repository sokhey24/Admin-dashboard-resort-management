<?php

namespace App\Http\Controllers\Api\User;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PermissionController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Permission::all());
    }

    public function store(Request $request): JsonResponse
    {
        $permission = Permission::create($request->validate(['name' => 'required|string|unique:permissions,name']));
        return response()->json($permission, 201);
    }

    public function destroy(Permission $permission): JsonResponse
    {
        $permission->delete();
        return response()->json(null, 204);
    }
}
