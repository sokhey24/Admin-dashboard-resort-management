<?php

namespace App\Http\Controllers\Api\User;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Models\UserPermission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserPermissionController extends Controller
{
    /**
     * GET /api/admin/users/{user}/permissions
     * Returns all permissions with source (role/user/none) and enabled status.
     */
    public function show(User $user): JsonResponse
    {
        $user->load('roles.permissions', 'userPermissions.permission');

        $rolePermNames = $user->roles
            ->flatMap(fn($r) => $r->permissions->pluck('name'))
            ->unique()
            ->toArray();

        $userOverrides = $user->userPermissions->keyBy('permission_id');

        $allPermissions = Permission::all()->map(function ($perm) use ($rolePermNames, $userOverrides) {
            $fromRole = in_array($perm->name, $rolePermNames);
            $override = $userOverrides->get($perm->id);

            if ($override) {
                $source  = 'user';
                $effect  = $override->effect;
                $enabled = $effect === 'allow';
            } elseif ($fromRole) {
                $source  = 'role';
                $effect  = 'allow';
                $enabled = true;
            } else {
                $source  = 'none';
                $effect  = 'none';
                $enabled = false;
            }

            return [
                'id'          => $perm->id,
                'name'        => $perm->name,
                'description' => $perm->description,
                'module'      => explode('.', $perm->name)[0],
                'source'      => $source,
                'effect'      => $effect,
                'enabled'     => $enabled,
            ];
        });

        return response()->json([
            'success' => true,
            'data'    => [
                'user'        => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email],
                'roles'       => $user->roles->map(fn($r) => ['id' => $r->id, 'name' => $r->name, 'display_name' => $r->display_name]),
                'permissions' => $allPermissions->values(),
            ],
        ]);
    }

    /**
     * PUT /api/admin/users/{user}/permissions
     * Saves user-level allow/deny overrides. Does NOT touch role_permissions.
     *
     * Request body:
     * { "permissions": [{ "permission_id": 1, "effect": "allow|deny|remove" }] }
     *
     * effect = "remove" clears any user-level override (falls back to role permission).
     */
    public function update(Request $request, User $user): JsonResponse
    {
        $request->validate([
            'permissions'              => 'required|array',
            'permissions.*.permission_id' => 'required|integer|exists:permissions,id',
            'permissions.*.effect'     => 'required|in:allow,deny,remove',
        ]);

        $admin = $request->user();

        foreach ($request->permissions as $item) {
            $permId = $item['permission_id'];
            $effect = $item['effect'];
            $perm   = Permission::find($permId);

            if ($effect === 'remove') {
                UserPermission::where('user_id', $user->id)
                    ->where('permission_id', $permId)
                    ->delete();

                ActivityLog::create([
                    'user_id'     => $admin->id,
                    'action'      => 'permission.remove_override',
                    'model_type'  => User::class,
                    'model_id'    => $user->id,
                    'description' => "Admin removed user override for {$perm->name} on {$user->email}",
                    'ip_address'  => $request->ip(),
                ]);
            } else {
                UserPermission::updateOrCreate(
                    ['user_id' => $user->id, 'permission_id' => $permId],
                    ['effect'  => $effect]
                );

                ActivityLog::create([
                    'user_id'     => $admin->id,
                    'action'      => $effect === 'allow' ? 'permission.enabled' : 'permission.disabled',
                    'model_type'  => User::class,
                    'model_id'    => $user->id,
                    'description' => "Admin {$effect}ed {$perm->name} for {$user->email}",
                    'ip_address'  => $request->ip(),
                ]);
            }
        }

        return $this->show($user);
    }

    /**
     * PUT /api/admin/users/{user}/role
     * Changes a user's role. Preserves existing user-level permission overrides.
     */
    public function updateRole(Request $request, User $user): JsonResponse
    {
        $request->validate([
            'role' => 'required|string|exists:roles,name',
        ]);

        $admin   = $request->user();
        $oldRole = $user->roles->first()?->name ?? 'none';
        $newRole = Role::where('name', $request->role)->firstOrFail();

        // Prevent removing the last admin
        if ($oldRole === 'admin' && $request->role !== 'admin') {
            $adminCount = Role::where('name', 'admin')
                ->first()
                ->users()
                ->count();
            if ($adminCount <= 1) {
                return response()->json([
                    'message' => 'Cannot remove the last system administrator.',
                ], 422);
            }
        }

        $user->roles()->sync($newRole->id);

        ActivityLog::create([
            'user_id'     => $admin->id,
            'action'      => 'role.changed',
            'model_type'  => User::class,
            'model_id'    => $user->id,
            'description' => "Admin changed role of {$user->email} from {$oldRole} to {$request->role}",
            'ip_address'  => $request->ip(),
        ]);

        $user->load('roles');

        return response()->json([
            'success' => true,
            'data'    => [
                'user'  => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email],
                'roles' => $user->roles->map(fn($r) => ['id' => $r->id, 'name' => $r->name, 'display_name' => $r->display_name]),
            ],
        ]);
    }
}
