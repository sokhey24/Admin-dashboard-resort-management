<?php

namespace App\Http\Controllers\Api\Staff;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class ResortStaffController extends Controller
{
    private function withImageUrl(User $user): array
    {
        $data = $user->toArray();
        $data['profile_image_url'] = $user->profile_image
            ? Storage::disk('public')->url($user->profile_image)
            : null;
        return $data;
    }

    private function staffQuery()
    {
        $roleIds = Role::whereIn('name', ['resort_manager', 'resort_staff'])->pluck('id');
        return User::with('roles')->whereHas('roles', fn($q) => $q->whereIn('roles.id', $roleIds));
    }

    public function index(): JsonResponse
    {
        $staff = $this->staffQuery()->get()->map(fn($u) => $this->withImageUrl($u));
        return response()->json(['data' => $staff]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'phone'    => 'nullable|string|max:20|unique:users,phone',
            'password' => 'required|string|min:8',
            'status'   => 'nullable|in:active,inactive',
            'role'     => 'nullable|in:resort_manager,resort_staff',
        ]);

        $roleName = $validated['role'] ?? 'resort_staff';
        unset($validated['role']);
        $validated['password'] = Hash::make($validated['password']);

        $user = User::create($validated);
        $role = Role::where('name', $roleName)->first();
        if ($role) $user->roles()->syncWithoutDetaching($role->id);

        return response()->json(['data' => $this->withImageUrl($user->load('roles'))], 201);
    }

    public function show(User $user): JsonResponse
    {
        $user->load('roles');
        return response()->json(['data' => $this->withImageUrl($user)]);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'name'   => 'sometimes|string|max:255',
            'email'  => 'sometimes|email|unique:users,email,' . $user->id,
            'phone'  => 'sometimes|nullable|string|max:20|unique:users,phone,' . $user->id,
            'status' => 'sometimes|in:active,inactive',
            'role'   => 'sometimes|in:resort_manager,resort_staff',
        ]);

        if (isset($validated['role'])) {
            $role = Role::where('name', $validated['role'])->first();
            if ($role) $user->roles()->sync($role->id);
            unset($validated['role']);
        }

        $user->update($validated);
        return response()->json(['data' => $this->withImageUrl($user->fresh()->load('roles'))]);
    }

    public function destroy(User $user): JsonResponse
    {
        if ($user->profile_image) {
            Storage::disk('public')->delete($user->profile_image);
        }
        $user->delete();
        return response()->json(null, 204);
    }
}
