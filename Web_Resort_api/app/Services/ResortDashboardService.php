<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Coupon;
use App\Models\Review;
use App\Models\Room;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ResortDashboardService
{
    public function __construct(protected PaymentService $payments) {}

    public function getSummary(array $filters = []): array
    {
        $today = Carbon::today();
        $user = Auth::user();
        $payFilters = array_merge($filters, ['source' => 'resort']);
        $payStats = $user
            ? $this->payments->stats($payFilters, $user)
            : ['collected' => 0, 'pending' => 0, 'refunded' => 0, 'paid_count' => 0, 'pending_count' => 0, 'refunded_count' => 0, 'outstanding' => 0];

        $todayPayFilters = array_merge($payFilters, ['date' => $filters['date'] ?? $today->toDateString()]);
        if (! empty($filters['month']) && empty($filters['date'])) {
            $todayPayFilters = $payFilters;
        }
        $todayStats = $user ? $this->payments->stats($todayPayFilters, $user) : $payStats;

        $rooms = Room::query();
        $bookings = Booking::query();
        $reviews = Review::query();
        $this->applyResortScope($rooms, $user, $filters['resort_id'] ?? null);
        $this->applyResortScope($bookings, $user, $filters['resort_id'] ?? null);
        $this->applyResortScope($reviews, $user, $filters['resort_id'] ?? null);

        $checkin = clone $bookings;
        $checkout = clone $bookings;
        $this->applyStayDate($checkin, $filters, 'check_in', $today);
        $this->applyStayDate($checkout, $filters, 'check_out', $today);

        $active = (clone $bookings)->whereIn('status', ['confirmed', 'checked_in']);
        $occupied = (clone $rooms)->where('status', 'occupied')->count();
        $maintenance = (clone $rooms)->where('status', 'maintenance')->count();
        $roomTotal = (clone $rooms)->count();
        $sellable = max(1, $roomTotal - $maintenance);

        return [
            'rooms_available' => (clone $rooms)->where('status', 'available')->count(),
            'rooms_occupied' => $occupied,
            'rooms_maintenance' => $maintenance,
            'rooms_reserved' => (clone $rooms)->where('status', 'reserved')->count(),
            'occupancy_rate' => round(($occupied / $sellable) * 100, 1),
            'checkin_today' => (clone $checkin)->whereIn('status', ['confirmed', 'checked_in'])->count(),
            'checkout_today' => (clone $checkout)->whereIn('status', ['checked_in', 'completed'])->count(),
            'active_bookings' => $active->count(),
            'current_stays' => (clone $bookings)->where('status', 'checked_in')->count(),
            'pending_bookings' => (clone $bookings)->where('status', 'pending')->count(),
            'average_rating' => round((float) ($reviews->avg('rating') ?? 0), 1),
            'coupon_used' => $this->couponUsedCount(),
            'revenue_today' => $todayStats['collected'] ?? 0,
            'revenue_total' => $payStats['collected'] ?? 0,
            'payments_paid' => $payStats['paid_count'] ?? 0,
            'payments_pending' => $payStats['pending_count'] ?? 0,
            'payments_refunded' => $payStats['refunded_count'] ?? 0,
            'outstanding_balance' => $payStats['outstanding'] ?? 0,
            'monthly_revenue' => $this->monthlyRevenue($filters, $user),
        ];
    }

    protected function monthlyRevenue(array $filters, $user): array
    {
        $year = ! empty($filters['year']) ? $filters['year'] : Carbon::now()->year;
        $query = \App\Models\Payment::query()
            ->where('status', 'paid')
            ->whereYear('paid_at', $year)
            ->where(function ($q) {
                $q->where('source', 'resort')
                    ->orWhere(function ($legacy) {
                        $legacy->whereNull('source')->whereNotNull('booking_id');
                    });
            });
        if ($user && ! $user->isAdmin()) {
            $assigned = $user->assignedResortIds();
            if ($assigned !== []) {
                $query->whereHas('booking', fn ($b) => $b->whereIn('resort_id', $assigned));
            }
        }
        if (! empty($filters['resort_id'])) {
            $query->whereHas('booking', fn ($b) => $b->where('resort_id', (int) $filters['resort_id']));
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
                'month' => $row->month,
                'revenue' => (float) $row->revenue,
            ])
            ->values()
            ->toArray();
    }

    protected function couponUsedCount(): int
    {
        if (! Schema::hasTable('coupons')) {
            return 0;
        }
        if (Schema::hasColumn('coupons', 'used_count')) {
            return (int) Coupon::sum('used_count');
        }
        if (Schema::hasColumn('coupons', 'is_used')) {
            return (int) Coupon::where('is_used', true)->count();
        }

        return 0;
    }

    protected function applyStayDate($query, array $filters, string $column, Carbon $today): void
    {
        if (! empty($filters['date'])) {
            $query->whereDate($column, $filters['date']);

            return;
        }
        if (! empty($filters['month'])) {
            $query->whereMonth($column, $filters['month'])
                ->whereYear($column, $filters['year'] ?? $today->year);

            return;
        }
        if (! empty($filters['year'])) {
            $query->whereYear($column, $filters['year']);

            return;
        }

        $query->whereDate($column, $today);
    }

    protected function applyResortScope($query, $user, mixed $resortId): void
    {
        if (! $user) {
            return;
        }

        $assigned = $user->resorts()->pluck('resorts.id');
        $isAdmin = $user->roles()->where('name', 'admin')->exists();
        $filterId = $resortId ? (int) $resortId : null;

        if (! $isAdmin && $assigned->isNotEmpty()) {
            $query->whereIn('resort_id', $assigned);
        }
        if ($filterId && ($isAdmin || $assigned->isEmpty() || $assigned->contains($filterId))) {
            $query->where('resort_id', $filterId);
        } elseif ($filterId && ! $isAdmin && $assigned->isNotEmpty() && ! $assigned->contains($filterId)) {
            $query->whereRaw('1 = 0');
        }
    }
}
