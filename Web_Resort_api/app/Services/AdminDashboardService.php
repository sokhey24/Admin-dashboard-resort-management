<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\Booking;
use App\Models\Branch;
use App\Models\FoodOrder;
use App\Models\Payment;
use App\Models\Resort;
use App\Models\RestaurantTable;
use App\Models\Room;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class AdminDashboardService
{
    public function __construct(
        protected ResortAccessService $resortAccess,
        protected BranchAccessService $branchAccess,
    ) {}

    public function getSummary(array $filters = [], ?User $user = null): array
    {
        $today = Carbon::today();

        return [
            'statistics'            => $this->getStatistics($today, $filters, $user),
            'monthly_revenue'       => $this->getMonthlyRevenue($filters, $user),
            'booking_statistics'    => $this->getBookingStatistics($filters, $user),
            'room_statistics'       => $this->getRoomStatistics($filters, $user),
            'restaurant_statistics' => $this->getRestaurantStatistics($filters, $user),
            'recent_activities'     => $this->getRecentActivities($filters, $user),
            'recent_bookings'       => $this->getRecentBookings($filters, $user),
        ];
    }

    /**
     * Apply date / month / year filter to a query builder.
     * Priority: date > month > year
     */
    private function applyDateFilter($query, array $filters, string $column): mixed
    {
        if (! empty($filters['date'])) {
            return $query->whereDate($column, $filters['date']);
        }
        if (! empty($filters['month']) && ! empty($filters['year'])) {
            return $query->whereMonth($column, $filters['month'])
                ->whereYear($column, $filters['year']);
        }
        if (! empty($filters['year'])) {
            return $query->whereYear($column, $filters['year']);
        }

        return $query;
    }

    private function scopedBookings(?User $user, array $filters = []): Builder
    {
        $query = Booking::query();
        $this->resortAccess->applyResortColumnScope(
            $query,
            $user,
            'resort_id',
            $filters['resort_id'] ?? null
        );
        $this->branchAccess->applyBookingBranchScope($query, $user, $filters['branch_id'] ?? null);

        return $query;
    }

    private function scopedRooms(?User $user, array $filters = []): Builder
    {
        $query = Room::query();
        $this->resortAccess->applyResortColumnScope(
            $query,
            $user,
            'resort_id',
            $filters['resort_id'] ?? null
        );
        $this->branchAccess->applyBranchColumnScope(
            $query,
            $user,
            'branch_id',
            $filters['branch_id'] ?? null
        );

        return $query;
    }

    private function scopedResorts(?User $user): Builder
    {
        $query = Resort::query();
        if ($user && ! $this->resortAccess->bypassesResortScope($user)) {
            $assigned = $this->resortAccess->assignedResortIds($user);
            if ($assigned === []) {
                $query->whereRaw('1 = 0');
            } else {
                $query->whereIn('id', $assigned);
            }
        }

        return $query;
    }

    private function scopedBranches(?User $user): Builder
    {
        $query = Branch::query();
        $this->resortAccess->applyResortColumnScope($query, $user, 'resort_id');

        return $query;
    }

    private function scopedPayments(?User $user): Builder
    {
        $query = Payment::query();
        if ($user && ! $this->resortAccess->bypassesResortScope($user)) {
            $assigned = $this->resortAccess->assignedResortIds($user);
            if ($assigned === []) {
                $query->whereRaw('1 = 0');
            } else {
                $query->whereHas('booking', fn ($b) => $b->whereIn('resort_id', $assigned));
            }
        }

        return $query;
    }

    private function scopedFoodOrders(?User $user, array $filters = []): Builder
    {
        $query = FoodOrder::query();
        if ($user && ! $this->resortAccess->bypassesResortScope($user)) {
            $assigned = $this->resortAccess->assignedResortIds($user);
            if ($assigned === []) {
                $query->whereRaw('1 = 0');
            } else {
                $query->where(function ($q) use ($assigned) {
                    $q->whereHas('booking', fn ($b) => $b->whereIn('resort_id', $assigned))
                        ->orWhereHas('restaurantTable', fn ($t) => $t->whereIn('resort_id', $assigned));
                });
            }
        }

        $this->branchAccess->applyFoodOrderBranchScope($query, $user, $filters['branch_id'] ?? null);

        return $query;
    }

    private function scopedRestaurantTables(?User $user, array $filters = []): Builder
    {
        $query = RestaurantTable::query();
        $this->resortAccess->applyResortColumnScope($query, $user, 'resort_id', $filters['resort_id'] ?? null);
        $this->branchAccess->applyBranchColumnScope(
            $query,
            $user,
            'branch_id',
            $filters['branch_id'] ?? null
        );

        return $query;
    }

    private function getStatistics(Carbon $today, array $filters, ?User $user): array
    {
        $checkinDate  = ! empty($filters['date']) ? $filters['date'] : $today;
        $checkoutDate = ! empty($filters['date']) ? $filters['date'] : $today;

        $bookings = $this->scopedBookings($user, $filters);
        $rooms    = $this->scopedRooms($user, $filters);
        $payments = $this->scopedPayments($user)->where('status', 'paid');

        $guestQuery = (clone $bookings)->whereNotNull('user_id')->distinct('user_id');

        return [
            'total_users'       => $this->resortAccess->bypassesResortScope($user)
                ? User::count()
                : (clone $guestQuery)->count('user_id'),
            'total_guests'      => (clone $guestQuery)->count('user_id'),
            'total_resorts'     => $this->scopedResorts($user)->count(),
            'active_resorts'    => $this->scopedResorts($user)->where('status', 'active')->count(),
            'total_branches'    => $this->scopedBranches($user)->count(),
            'total_rooms'       => (clone $rooms)->count(),
            'total_tables'      => $this->scopedRestaurantTables($user, $filters)->count(),
            'total_bookings'    => $this->applyDateFilter(clone $bookings, $filters, 'created_at')->count(),
            'pending_bookings'  => (clone $bookings)->where('status', 'pending')->count(),
            'today_checkins'    => (clone $bookings)->whereDate('check_in', $checkinDate)->whereIn('status', ['confirmed', 'checked_in'])->count(),
            'today_checkouts'   => (clone $bookings)->whereDate('check_out', $checkoutDate)->whereIn('status', ['checked_in', 'completed'])->count(),
            'current_stays'     => (clone $bookings)->where('status', 'checked_in')->count(),
            'occupancy_rate'    => $this->occupancyRate($user, $filters),
            'total_revenue'     => (float) $this->applyDateFilter(clone $payments, $filters, 'paid_at')->sum('paid_amount'),
            'pending_payments'  => (float) (clone $bookings)->sum('balance_due'),
            'restaurant_orders' => $this->applyDateFilter($this->scopedFoodOrders($user, $filters), $filters, 'created_at')->count(),
        ];
    }

    private function getMonthlyRevenue(array $filters, ?User $user): array
    {
        $year = ! empty($filters['year']) ? $filters['year'] : Carbon::now()->year;

        $query = $this->scopedPayments($user)->where('status', 'paid')->whereYear('paid_at', $year);

        if (! empty($filters['date'])) {
            $query->whereDate('paid_at', $filters['date']);
        } elseif (! empty($filters['month'])) {
            $query->whereMonth('paid_at', $filters['month']);
        }

        return $query->select(
            DB::raw('MONTH(paid_at) as month_num'),
            DB::raw('MONTHNAME(paid_at) as month'),
            DB::raw('SUM(paid_amount) as revenue')
        )
            ->groupBy('month_num', 'month')
            ->orderBy('month_num')
            ->get()
            ->map(fn ($row) => [
                'month'   => $row->month,
                'revenue' => (float) $row->revenue,
            ])
            ->values()
            ->toArray();
    }

    private function getBookingStatistics(array $filters, ?User $user): array
    {
        return $this->applyDateFilter($this->scopedBookings($user, $filters), $filters, 'created_at')
            ->select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->get()
            ->map(fn ($row) => [
                'status' => $row->status,
                'count'  => $row->count,
            ])
            ->values()
            ->toArray();
    }

    private function getRoomStatistics(array $filters, ?User $user): array
    {
        return $this->scopedRooms($user, $filters)
            ->select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->get()
            ->map(fn ($row) => [
                'status' => $row->status,
                'count'  => $row->count,
            ])
            ->values()
            ->toArray();
    }

    private function getRestaurantStatistics(array $filters, ?User $user): array
    {
        return $this->applyDateFilter($this->scopedFoodOrders($user, $filters), $filters, 'created_at')
            ->select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->get()
            ->map(fn ($row) => [
                'status' => $row->status,
                'count'  => $row->count,
            ])
            ->values()
            ->toArray();
    }

    private function getRecentBookings(array $filters, ?User $user): array
    {
        return $this->applyDateFilter(
            $this->scopedBookings($user, $filters)->with('user:id,name,email', 'rooms:id,room_number'),
            $filters,
            'created_at'
        )
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn ($b) => [
                'id'           => $b->id,
                'booking_code' => $b->booking_code,
                'status'       => $b->status,
                'check_in'     => $b->check_in,
                'check_out'    => $b->check_out,
                'total_amount' => $b->total_amount,
                'created_at'   => $b->created_at,
                'user'         => $b->user,
                'rooms'        => $b->rooms,
            ])
            ->toArray();
    }

    private function getRecentActivities(array $filters, ?User $user): array
    {
        $query = ActivityLog::with('user:id,name');
        if ($user && ! $this->resortAccess->bypassesResortScope($user)) {
            $assigned = $this->resortAccess->assignedResortIds($user);
            if ($assigned === []) {
                $query->whereRaw('1 = 0');
            } else {
                $query->whereIn('user_id', function ($sub) use ($assigned) {
                    $sub->select('user_id')
                        ->from('user_resort')
                        ->whereIn('resort_id', $assigned);
                });
            }
        }

        return $this->applyDateFilter($query, $filters, 'created_at')
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn ($log) => [
                'id'          => $log->id,
                'user'        => $log->user?->name ?? 'System',
                'action'      => $log->action,
                'model_type'  => $log->model_type,
                'description' => $log->description,
                'ip_address'  => $log->ip_address,
                'created_at'  => $log->created_at,
            ])
            ->toArray();
    }

    private function occupancyRate(?User $user, array $filters = []): float
    {
        $rooms = $this->scopedRooms($user, $filters);
        $total = (clone $rooms)->count();
        $maintenance = (clone $rooms)->where('status', 'maintenance')->count();
        $occupied = (clone $rooms)->where('status', 'occupied')->count();
        $sellable = max(1, $total - $maintenance);

        return round(($occupied / $sellable) * 100, 1);
    }
}
