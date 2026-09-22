<?php

namespace App\Http\Controllers\Api\User;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class UserController extends Controller
{
    private function withImageUrl(User $user): array
    {
        $data = $user->toArray();
        $data['profile_image_url'] = $user->profile_image
            ? Storage::disk('public')->url($user->profile_image)
            : null;
        return $data;
    }

    public function index(Request $request): JsonResponse
    {
        $q = User::with('roles');

        if ($date = $request->query('date')) {
            $q->whereDate('created_at', $date);
        } elseif ($month = $request->query('month')) {
            $q->whereMonth('created_at', $month)
              ->whereYear('created_at', $request->query('year', now()->year));
        } elseif ($year = $request->query('year')) {
            $q->whereYear('created_at', $year);
        }

        $users = $q->get()->map(fn($u) => $this->withImageUrl($u));
        return response()->json(['data' => $users]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'phone'    => 'nullable|string|max:20|unique:users,phone',
            'password' => 'required|string|min:8',
            'status'   => 'nullable|in:active,inactive',
            'role'     => 'nullable|string|exists:roles,name',
        ]);

        $validated['password'] = Hash::make($validated['password']);
        $roleName = $validated['role'] ?? null;
        unset($validated['role']);

        $user = User::create($validated);

        if ($roleName) {
            $role = \App\Models\Role::where('name', $roleName)->first();
            if ($role) $user->roles()->syncWithoutDetaching($role->id);
        }

        $user->load('roles');
        return response()->json(['data' => $this->withImageUrl($user)], 201);
    }

    public function show(User $user): JsonResponse
    {
        $user->load('roles');
        return response()->json(['data' => $this->withImageUrl($user)]);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'name'     => 'sometimes|string|max:255',
            'email'    => 'sometimes|email|unique:users,email,' . $user->id,
            'phone'    => 'sometimes|nullable|string|max:20|unique:users,phone,' . $user->id,
            'password' => 'sometimes|string|min:8|confirmed',
            'status'   => 'sometimes|in:active,inactive',
            'role'     => 'sometimes|nullable|string|exists:roles,name',
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        if ($request->hasFile('profile_image')) {
            $request->validate(['profile_image' => 'image|mimes:jpg,jpeg,png|max:2048']);
            if ($user->profile_image) {
                Storage::disk('public')->delete($user->profile_image);
            }
            $validated['profile_image'] = $request->file('profile_image')->store('profile_images', 'public');
        }

        $roleName = $validated['role'] ?? null;
        unset($validated['role']);

        $user->update($validated);

        if ($roleName) {
            $role = \App\Models\Role::where('name', $roleName)->first();
            if ($role) $user->roles()->sync($role->id);
        }

        return response()->json(['data' => $this->withImageUrl($user->fresh()->load('roles'))]);
    }

    public function assignRole(Request $request, User $user): JsonResponse
    {
        $request->validate(['role' => 'required|string|exists:roles,name']);
        $role = \App\Models\Role::where('name', $request->role)->first();
        $user->roles()->sync($role->id);
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
