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
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class AdminDashboardService
{
    public function getSummary(array $filters = []): array
    {
        $today = Carbon::today();

        return [
            'statistics'            => $this->getStatistics($today, $filters),
            'monthly_revenue'       => $this->getMonthlyRevenue($filters),
            'booking_statistics'    => $this->getBookingStatistics($filters),
            'room_statistics'       => $this->getRoomStatistics(),
            'restaurant_statistics' => $this->getRestaurantStatistics($filters),
            'recent_activities'     => $this->getRecentActivities($filters),
            'recent_bookings'       => $this->getRecentBookings($filters),
        ];
    }

    /**
     * Apply date / month / year filter to a query builder.
     * Priority: date > month > year
     */
    private function applyDateFilter($query, array $filters, string $column): mixed
    {
        if (!empty($filters['date'])) {
            return $query->whereDate($column, $filters['date']);
        }
        if (!empty($filters['month']) && !empty($filters['year'])) {
            return $query->whereMonth($column, $filters['month'])
                         ->whereYear($column, $filters['year']);
        }
        if (!empty($filters['year'])) {
            return $query->whereYear($column, $filters['year']);
        }
        return $query;
    }

    private function getStatistics(Carbon $today, array $filters): array
    {
        $checkinDate  = !empty($filters['date']) ? $filters['date'] : $today;
        $checkoutDate = !empty($filters['date']) ? $filters['date'] : $today;

        return [
            'total_users'       => User::count(),
            'total_guests'      => User::whereHas('roles', fn ($q) => $q->where('name', 'customer'))->count()
                ?: Booking::query()->whereNotNull('user_id')->distinct('user_id')->count('user_id'),
            'total_resorts'     => Resort::count(),
            'active_resorts'    => Resort::where('status', 'active')->count(),
            'total_branches'    => Branch::count(),
            'total_rooms'       => Room::count(),
            'total_tables'      => class_exists(RestaurantTable::class) ? RestaurantTable::count() : 0,
            'total_bookings'    => $this->applyDateFilter(Booking::query(), $filters, 'created_at')->count(),
            'pending_bookings'  => Booking::where('status', 'pending')->count(),
            'today_checkins'    => Booking::whereDate('check_in', $checkinDate)->whereIn('status', ['confirmed', 'checked_in'])->count(),
            'today_checkouts'   => Booking::whereDate('check_out', $checkoutDate)->whereIn('status', ['checked_in', 'completed'])->count(),
            'current_stays'     => Booking::where('status', 'checked_in')->count(),
            'occupancy_rate'    => $this->occupancyRate(),
            'total_revenue'     => $this->applyDateFilter(Payment::where('status', 'paid'), $filters, 'paid_at')->sum('paid_amount'),
            'pending_payments'  => (float) Booking::sum('balance_due'),
            'restaurant_orders' => $this->applyDateFilter(FoodOrder::query(), $filters, 'created_at')->count(),
        ];
    }

    private function getMonthlyRevenue(array $filters): array
    {
        $year = !empty($filters['year']) ? $filters['year'] : Carbon::now()->year;

        $query = Payment::where('status', 'paid')->whereYear('paid_at', $year);

        if (!empty($filters['date'])) {
            $query->whereDate('paid_at', $filters['date']);
        } elseif (!empty($filters['month'])) {
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
            ->map(fn($row) => [
                'month'   => $row->month,
                'revenue' => (float) $row->revenue,
            ])
            ->values()
            ->toArray();
    }

    private function getBookingStatistics(array $filters): array
    {
        return $this->applyDateFilter(Booking::query(), $filters, 'created_at')
            ->select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->get()
            ->map(fn($row) => [
                'status' => $row->status,
                'count'  => $row->count,
            ])
            ->values()
            ->toArray();
    }

    private function getRoomStatistics(): array
    {
        return Room::select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->get()
            ->map(fn($row) => [
                'status' => $row->status,
                'count'  => $row->count,
            ])
            ->values()
            ->toArray();
    }

    private function getRestaurantStatistics(array $filters): array
    {
        return $this->applyDateFilter(FoodOrder::query(), $filters, 'created_at')
            ->select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->get()
            ->map(fn($row) => [
                'status' => $row->status,
                'count'  => $row->count,
            ])
            ->values()
            ->toArray();
    }

    private function getRecentBookings(array $filters): array
    {
        return $this->applyDateFilter(Booking::with('user:id,name,email', 'rooms:id,room_number'), $filters, 'created_at')
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn($b) => [
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

    private function getRecentActivities(array $filters): array
    {
        return $this->applyDateFilter(ActivityLog::with('user:id,name'), $filters, 'created_at')
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn($log) => [
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

    private function occupancyRate(): float
    {
        $total = Room::count();
        $maintenance = Room::where('status', 'maintenance')->count();
        $occupied = Room::where('status', 'occupied')->count();
        $sellable = max(1, $total - $maintenance);

        return round(($occupied / $sellable) * 100, 1);
    }
}
