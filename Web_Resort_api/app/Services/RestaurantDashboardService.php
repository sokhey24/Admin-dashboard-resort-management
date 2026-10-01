<?php

namespace App\Services;

use App\Models\FoodOrder;
use App\Models\MenuItem;
use App\Models\RestaurantBill;
use App\Models\RestaurantTable;
use App\Models\TableReservation;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;

class RestaurantDashboardService
{
    public function __construct(protected BranchAccessService $branchAccess) {}

    /**
     * @param  array<string, mixed>  $filters
     */
    public function getSummary(?User $user = null, array $filters = []): array
    {
        $today = Carbon::today();
        $branchId = ! empty($filters['branch_id']) ? (int) $filters['branch_id'] : null;

        $orders = $this->scopedFoodOrders($user, $branchId);
        $tables = $this->scopedTables($user, $branchId);
        $bills = $this->scopedBills($user, $branchId);

        return [
            'orders_today'       => (clone $orders)->whereDate('created_at', $today)->count(),
            'pending_orders'     => (clone $orders)->where('status', 'pending')->count(),
            'tables_available'   => (clone $tables)->where('status', 'available')->count(),
            'tables_occupied'    => (clone $tables)->where('status', 'occupied')->count(),
            'reservations_today' => TableReservation::query()
                ->whereHas('table', function (Builder $t) use ($user, $branchId) {
                    $this->branchAccess->applyBranchColumnScope($t, $user, 'branch_id', $branchId);
                })
                ->whereDate('reserved_at', $today)
                ->count(),
            'revenue_today'      => (clone $bills)->whereDate('created_at', $today)->sum('total'),
            'top_menu_items'     => MenuItem::withCount(['orderItems' => function ($q) use ($user, $branchId) {
                $q->whereHas('foodOrder', function (Builder $o) use ($user, $branchId) {
                    $this->branchAccess->applyFoodOrderBranchScope($o, $user, $branchId);
                });
            }])
                ->orderByDesc('order_items_count')
                ->take(5)
                ->get(),
        ];
    }

    protected function scopedFoodOrders(?User $user, ?int $branchId): Builder
    {
        $query = FoodOrder::query();
        $this->branchAccess->applyFoodOrderBranchScope($query, $user, $branchId);

        return $query;
    }

    protected function scopedTables(?User $user, ?int $branchId): Builder
    {
        $query = RestaurantTable::query();
        $this->branchAccess->applyBranchColumnScope($query, $user, 'branch_id', $branchId);

        return $query;
    }

    protected function scopedBills(?User $user, ?int $branchId): Builder
    {
        return RestaurantBill::query()->whereHas('order', function (Builder $q) use ($user, $branchId) {
            $this->branchAccess->applyFoodOrderBranchScope($q, $user, $branchId);
        });
    }
}
