<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\ContactInquiry;
use App\Models\ServiceInquiry;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class GuestInquiryScopeService
{
    public function __construct(protected BranchAccessService $branchAccess) {}

    /**
     * @return string[]
     */
    public function allowedResortNames(?User $user, ?int $filterBranchId = null): ?array
    {
        if ($this->branchAccess->bypassesBranchScope($user)) {
            if ($filterBranchId) {
                $name = Branch::query()->whereKey($filterBranchId)->value('name');

                return $name ? [$name] : [];
            }

            return null;
        }

        $assigned = $this->branchAccess->assignedBranchIds($user);
        if ($assigned === []) {
            return [];
        }

        if ($filterBranchId) {
            if (! in_array($filterBranchId, $assigned, true)) {
                return [];
            }
            $assigned = [$filterBranchId];
        }

        return Branch::query()
            ->whereIn('id', $assigned)
            ->pluck('name')
            ->filter()
            ->map(fn ($n) => (string) $n)
            ->all();
    }

    public function applyResortNameScope(
        Builder $query,
        ?User $user,
        string $column = 'resort_name',
        ?int $filterBranchId = null
    ): void {
        $names = $this->allowedResortNames($user, $filterBranchId);

        if ($names === null) {
            return;
        }

        if ($names === []) {
            $query->whereRaw('1 = 0');

            return;
        }

        $query->whereIn($column, $names);
    }

    public function assertResortInquiryAccessible(Model $inquiry, ?User $user): void
    {
        if (! $inquiry instanceof ServiceInquiry && ! $inquiry instanceof ContactInquiry) {
            return;
        }

        $resortName = (string) ($inquiry->resort_name ?? '');
        $allowed = $this->allowedResortNames($user);

        if ($allowed === null) {
            return;
        }

        if ($allowed === [] || ! in_array($resortName, $allowed, true)) {
            abort(403, 'Forbidden: You do not have permission to access data for this branch.');
        }
    }
}
