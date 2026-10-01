<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Schema;

/**
 * Enterprise Branch-level data visibility & security service.
 * Enforces single-brand multi-branch data isolation:
 * - Super-admins and corporate users with global analytics permissions see all branches.
 * - Operational staff are strictly scoped to their assigned branches in `user_branch`.
 */
class BranchAccessService
{
    /**
     * Determine if the user bypasses branch-level scoping.
     * Returns true for Super Admins or roles with global view privileges.
     */
    public function bypassesBranchScope(?User $user): bool
    {
        if (! $user) {
            return false;
        }

        if ($user->isAdmin()) {
            return true;
        }

        return $user->hasPermission('admin.dashboard.view')
            || $user->hasPermission('admin.reports.view')
            || $user->hasPermission('admin.resorts.view');
    }

    /**
     * Retrieve the list of branch IDs the user has been assigned to.
     *
     * @return int[]
     */
    public function assignedBranchIds(?User $user): array
    {
        if (! $user) {
            return [];
        }

        if (Schema::hasTable('user_branch')) {
            $direct = $user->branches()->pluck('branches.id')->map(fn ($id) => (int) $id)->all();
            if ($direct !== []) {
                return $direct;
            }
        }

        // Fallback: if user has assigned resort in legacy user_resort
        if (Schema::hasTable('user_resort')) {
            $resortIds = $user->resorts()->pluck('resorts.id')->map(fn ($id) => (int) $id)->all();
            if ($resortIds !== []) {
                return Branch::query()
                    ->whereIn('resort_id', $resortIds)
                    ->pluck('id')
                    ->map(fn ($id) => (int) $id)
                    ->all();
            }
        }

        return [];
    }

    /**
     * Enforce branch scope on an Eloquent query builder.
     * If user has global scope, applies optional filterBranchId if provided.
     * Otherwise, restricts records strictly to assignedBranchIds().
     */
    public function applyBranchScope(
        Builder $query,
        ?User $user,
        string $column = 'branch_id',
        ?int $filterBranchId = null
    ): void {
        $filterId = $filterBranchId ? (int) $filterBranchId : null;

        if ($this->bypassesBranchScope($user)) {
            if ($filterId) {
                $query->where($column, $filterId);
            }

            return;
        }

        $assigned = $this->assignedBranchIds($user);
        if ($assigned === []) {
            $query->whereRaw('1 = 0');

            return;
        }

        $query->whereIn($column, $assigned);

        if ($filterId) {
            if (in_array($filterId, $assigned, true)) {
                $query->where($column, $filterId);
            } else {
                $query->whereRaw('1 = 0');
            }
        }
    }

    /**
     * Backward-compatible alias for applyBranchScope.
     */
    public function applyBranchColumnScope(
        Builder $query,
        ?User $user,
        string $column = 'branch_id',
        mixed $filterBranchId = null
    ): void {
        $this->applyBranchScope($query, $user, $column, $filterBranchId ? (int) $filterBranchId : null);
    }

    /**
     * Assert that the current user has permission to access the target branch.
     * Aborts with HTTP 403 Forbidden on violation.
     */
    public function assertBranchAccessible(?User $user, int $branchId): void
    {
        if ($this->bypassesBranchScope($user)) {
            return;
        }

        $assigned = $this->assignedBranchIds($user);
        if ($assigned === [] || ! in_array($branchId, $assigned, true)) {
            abort(403, 'Forbidden: You do not have permission to access data for this branch.');
        }
    }

    /**
     * Restrict bookings to allowed / filtered branches.
     */
    public function applyBookingBranchScope(Builder $query, ?User $user, mixed $filterBranchId = null): void
    {
        $filterId = $filterBranchId ? (int) $filterBranchId : null;
        $table = $query->getModel()->getTable();

        if (Schema::hasColumn($table, 'branch_id')) {
            $this->applyBranchScope($query, $user, 'branch_id', $filterId);

            return;
        }

        if ($this->bypassesBranchScope($user)) {
            if ($filterId) {
                $query->whereHas('rooms', fn (Builder $r) => $r->where('branch_id', $filterId));
            }

            return;
        }

        $assigned = $this->assignedBranchIds($user);
        if ($assigned === []) {
            $query->whereRaw('1 = 0');

            return;
        }

        $query->whereHas('rooms', function (Builder $r) use ($assigned, $filterId) {
            $r->whereIn('branch_id', $assigned);
            if ($filterId) {
                $r->where('branch_id', $filterId);
            }
        });
    }

    /**
     * Restrict food orders to allowed / filtered branches.
     */
    public function applyFoodOrderBranchScope(Builder $query, ?User $user, mixed $filterBranchId = null): void
    {
        $filterId = $filterBranchId ? (int) $filterBranchId : null;
        $table = $query->getModel()->getTable();

        if (Schema::hasColumn($table, 'branch_id')) {
            $this->applyBranchScope($query, $user, 'branch_id', $filterId);

            return;
        }

        $query->whereHas('restaurantTable', function (Builder $t) use ($user, $filterId) {
            if (Schema::hasColumn($t->getModel()->getTable(), 'branch_id')) {
                $this->applyBranchScope($t, $user, 'branch_id', $filterId);
            } elseif ($user && ! $this->bypassesBranchScope($user)) {
                $assigned = $this->assignedBranchIds($user);
                if ($assigned === []) {
                    $t->whereRaw('1 = 0');
                }
            }
        });
    }
}
