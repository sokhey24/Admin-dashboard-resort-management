<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class PermissionMiddleware
{
    public function handle(Request $request, Closure $next, string ...$permissions): mixed
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Admin role bypasses all permission checks
        if ($user->roles()->where('name', 'admin')->exists()) {
            return $next($request);
        }

        $effective = $user->permissions();

        foreach ($permissions as $permission) {
            if (in_array($permission, $effective)) {
                return $next($request);
            }
        }

        return response()->json(['message' => 'Forbidden. You do not have permission to perform this action.'], 403);
    }
}
