<?php

namespace App\Policies;

use App\Models\FoodOrder;
use App\Models\User;
use App\Services\BranchAccessService;

class FoodOrderPolicy
{
    public function view(User $user, FoodOrder $foodOrder): bool
    {
        return $this->allows($user, $foodOrder);
    }

    public function update(User $user, FoodOrder $foodOrder): bool
    {
        return $this->allows($user, $foodOrder);
    }

    public function delete(User $user, FoodOrder $foodOrder): bool
    {
        return $this->allows($user, $foodOrder);
    }

    protected function allows(User $user, FoodOrder $foodOrder): bool
    {
        if ($user->isGuestAccount()) {
            return (int) $foodOrder->user_id === (int) $user->id;
        }

        $scoped = FoodOrder::query()->whereKey($foodOrder->id);
        app(BranchAccessService::class)->applyFoodOrderBranchScope($scoped, $user, null);

        return $scoped->exists();
    }
}
