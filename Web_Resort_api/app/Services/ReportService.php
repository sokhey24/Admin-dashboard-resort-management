<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Guest;
use App\Models\Payment;
use App\Models\Room;
use App\Models\User;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ReportService
{
    public function __construct(
        protected ResortAccessService $resortAccess,
        protected BranchAccessService $branchAccess,
        protected PaymentService $payments,
    ) {}

    /**
     * Combined payload for the reports UI (single request).
     *
     * @param  array<string, mixed>  $filters
     */
    public function fullReport(array $filters, ?User $user, int $page = 1, int $perPage = 15): array
    {
        $filters = $this->normalizeFilters($filters);

        $bookings = $this->bookingsReport($filters, $user);
        $revenue = $this->revenueReport($filters, $user);
        $rooms = $this->roomsReport($filters, $user);
        $guests = $this->guestsReport($filters, $user);

        return [
            'period'   => [
                'date_from' => $filters['date_from'],
                'date_to'   => $filters['date_to'],
            ],
            'filters'  => [
                'resort_id' => $filters['resort_id'] ?? null,
                'branch_id' => $filters['branch_id'] ?? null,
            ],
            'summary'  => [
                'total_bookings' => $bookings['total'],
                'revenue'        => $revenue['paid_amount'],
                'occupancy_rate' => $rooms['occupancy_rate'],
                'total_guests'   => $guests['guest_headcount'],
            ],
            'bookings' => $bookings,
            'revenue'  => $revenue,
            'rooms'    => $rooms,
            'guests'   => $guests,
            'daily'    => $this->dailyBreakdown($filters, $user, $page, $perPage),
        ];
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public function bookingsReport(array $filters, ?User $user = null): array
    {
        $filters = $this->normalizeFilters($filters);
        $user = $user ?? Auth::user();
        $base = $this->scopedBookingsQuery($filters, $user);
        $inRange = $this->applyBookingDateRange(clone $base, $filters);

        $byStatus = (clone $inRange)
            ->select('bookings.status', DB::raw('COUNT(*) as count'))
            ->groupBy('bookings.status')
            ->pluck('count', 'status')
            ->all();

        $statusCounts = [];
        foreach (Booking::STATUSES as $status) {
            $statusCounts[$status] = (int) ($byStatus[$status] ?? 0);
        }

        $byDate = (clone $inRange)
            ->select(DB::raw('DATE(bookings.created_at) as date'), DB::raw('COUNT(*) as count'))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(fn ($row) => ['date' => $row->date, 'count' => (int) $row->count])
            ->values()
            ->all();

        $byResort = (clone $inRange)
            ->join('resorts', 'resorts.id', '=', 'bookings.resort_id')
            ->select('resorts.id as resort_id', 'resorts.name as resort_name', DB::raw('COUNT(bookings.id) as count'))
            ->groupBy('resorts.id', 'resorts.name')
            ->orderByDesc('count')
            ->get()
            ->map(fn ($row) => [
                'resort_id'   => (int) $row->resort_id,
                'resort_name' => $row->resort_name,
                'count'       => (int) $row->count,
            ])
            ->values()
            ->all();

        $byRoomType = (clone $inRange)
            ->join('booking_rooms', 'booking_rooms.booking_id', '=', 'bookings.id')
            ->join('rooms', 'rooms.id', '=', 'booking_rooms.room_id')
            ->join('room_types', 'room_types.id', '=', 'rooms.room_type_id')
            ->when(! empty($filters['branch_id']), fn ($q) => $q->where('rooms.branch_id', (int) $filters['branch_id']))
            ->select('room_types.id as room_type_id', 'room_types.name as room_type_name', DB::raw('COUNT(DISTINCT bookings.id) as count'))
            ->groupBy('room_types.id', 'room_types.name')
            ->orderByDesc('count')
            ->get()
            ->map(fn ($row) => [
                'room_type_id'   => (int) $row->room_type_id,
                'room_type_name' => $row->room_type_name,
                'count'          => (int) $row->count,
            ])
            ->values()
            ->all();

        $total = (int) (clone $inRange)->count();

        return [
            'total'       => $total,
            'by_status'   => $statusCounts,
            'pending'     => $statusCounts['pending'] ?? 0,
            'confirmed'   => $statusCounts['confirmed'] ?? 0,
            'checked_in'  => $statusCounts['checked_in'] ?? 0,
            'checked_out' => $statusCounts['checked_out'] ?? 0,
            'cancelled'   => $statusCounts['cancelled'] ?? 0,
            'completed'   => $statusCounts['completed'] ?? 0,
            'by_date'     => $byDate,
            'by_resort'   => $byResort,
            'by_room_type'=> $byRoomType,
        ];
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public function revenueReport(array $filters, ?User $user = null): array
    {
        $filters = $this->normalizeFilters($filters);
        $user = $user ?? Auth::user();

        $payFilters = array_merge($filters, ['source' => 'resort']);
        $stats = $user ? $this->payments->stats($payFilters, $user) : [
            'collected' => 0, 'pending' => 0, 'refunded' => 0, 'outstanding' => 0,
        ];

        $paymentBase = $this->scopedResortPaymentsQuery($filters, $user);
        $paidInPeriod = (clone $paymentBase)
            ->where('payments.status', 'paid')
            ->whereDate('payments.paid_at', '>=', $filters['date_from'])
            ->whereDate('payments.paid_at', '<=', $filters['date_to'])
            ->sum('payments.paid_amount');
        $refundedInPeriod = (clone $paymentBase)
            ->where('payments.status', 'refunded')
            ->whereDate('payments.refunded_at', '>=', $filters['date_from'])
            ->whereDate('payments.refunded_at', '<=', $filters['date_to'])
            ->sum('payments.refund_amount');

        $bookingQ = $this->applyBookingDateRange($this->scopedBookingsQuery($filters, $user), $filters);
        $gross = (float) $bookingQ->sum('bookings.total_amount');
        $discount = (float) $bookingQ->sum(DB::raw('COALESCE(bookings.discount,0) + COALESCE(bookings.room_discount_total,0)'));
        $tax = (float) $bookingQ->sum('bookings.tax_amount');
        $serviceCharge = (float) $bookingQ->sum('bookings.service_charge_amount');

        $paymentQ = $this->scopedResortPaymentsQuery($filters, $user);
        $this->applyPaymentDateRange($paymentQ, $filters);

        $byDate = (clone $paymentQ)
            ->where('payments.status', 'paid')
            ->select(DB::raw('DATE(payments.paid_at) as date'), DB::raw('SUM(payments.paid_amount) as revenue'))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(fn ($row) => ['date' => $row->date, 'revenue' => round((float) $row->revenue, 2)])
            ->values()
            ->all();

        $byMethod = (clone $paymentQ)
            ->where('payments.status', 'paid')
            ->select(
                'payments.payment_method',
                'payments.method',
                DB::raw('SUM(payments.paid_amount) as revenue')
            )
            ->groupBy('payments.payment_method', 'payments.method')
            ->get()
            ->groupBy(fn ($row) => $row->payment_method ?: $row->method ?: 'unknown')
            ->map(fn ($rows, $method) => [
                'method'  => $method,
                'revenue' => round((float) $rows->sum('revenue'), 2),
            ])
            ->sortByDesc('revenue')
            ->values()
            ->all();

        $byResort = (clone $paymentQ)
            ->where('payments.status', 'paid')
            ->join('bookings', 'bookings.id', '=', 'payments.booking_id')
            ->join('resorts', 'resorts.id', '=', 'bookings.resort_id')
            ->select('resorts.id as resort_id', 'resorts.name as resort_name', DB::raw('SUM(payments.paid_amount) as revenue'))
            ->groupBy('resorts.id', 'resorts.name')
            ->orderByDesc('revenue')
            ->get()
            ->map(fn ($row) => [
                'resort_id'   => (int) $row->resort_id,
                'resort_name' => $row->resort_name,
                'revenue'     => round((float) $row->revenue, 2),
            ])
            ->values()
            ->all();

        $byBooking = (clone $paymentQ)
            ->where('payments.status', 'paid')
            ->join('bookings', 'bookings.id', '=', 'payments.booking_id')
            ->select(
                'bookings.id as booking_id',
                'bookings.booking_code',
                DB::raw('SUM(payments.paid_amount) as revenue')
            )
            ->groupBy('bookings.id', 'bookings.booking_code')
            ->orderByDesc('revenue')
            ->limit(20)
            ->get()
            ->map(fn ($row) => [
                'booking_id'   => (int) $row->booking_id,
                'booking_code' => $row->booking_code,
                'revenue'      => round((float) $row->revenue, 2),
            ])
            ->values()
            ->all();

        return [
            'gross_revenue'    => round($gross, 2),
            'paid_amount'      => round((float) $paidInPeriod, 2),
            'pending_amount'   => round((float) ($stats['pending'] ?? 0), 2),
            'outstanding'      => round((float) ($stats['outstanding'] ?? 0), 2),
            'refunded_amount'  => round((float) $refundedInPeriod, 2),
            'discount_amount'  => round($discount, 2),
            'tax_amount'       => round($tax, 2),
            'service_charge'   => round($serviceCharge, 2),
            'by_date'          => $byDate,
            'by_resort'        => $byResort,
            'by_payment_method'=> $byMethod,
            'by_booking'       => $byBooking,
        ];
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public function roomsReport(array $filters, ?User $user = null): array
    {
        $filters = $this->normalizeFilters($filters);
        $user = $user ?? Auth::user();

        $rooms = $this->scopedRoomsQuery($filters, $user);
        $byStatus = (clone $rooms)
            ->select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->all();

        $total = (int) (clone $rooms)->count();
        $available = (int) ($byStatus['available'] ?? 0);
        $occupied = (int) ($byStatus['occupied'] ?? 0);
        $reserved = (int) ($byStatus['reserved'] ?? 0);
        $maintenance = (int) ($byStatus['maintenance'] ?? 0);
        $sellable = max(1, $total - $maintenance);
        $occupancyRate = round(($occupied / $sellable) * 100, 1);

        $byRoomType = (clone $rooms)
            ->join('room_types', 'room_types.id', '=', 'rooms.room_type_id')
            ->select('room_types.name as room_type_name', 'rooms.status', DB::raw('COUNT(*) as count'))
            ->groupBy('room_types.name', 'rooms.status')
            ->get()
            ->groupBy('room_type_name')
            ->map(fn ($rows, $name) => [
                'room_type_name' => $name,
                'total'          => $rows->sum('count'),
                'occupied'       => (int) ($rows->firstWhere('status', 'occupied')?->count ?? 0),
            ])
            ->values()
            ->all();

        $occupancyByDate = $this->occupancyTrendByDate($filters, $user);

        return [
            'total'             => $total,
            'available'         => $available,
            'occupied'          => $occupied,
            'reserved'          => $reserved,
            'maintenance'       => $maintenance,
            'occupancy_rate'    => $occupancyRate,
            'utilization'       => $occupancyRate,
            'by_status'         => [
                'available'   => $available,
                'occupied'    => $occupied,
                'reserved'    => $reserved,
                'maintenance' => $maintenance,
            ],
            'by_room_type'      => $byRoomType,
            'occupancy_by_date' => $occupancyByDate,
        ];
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public function guestsReport(array $filters, ?User $user = null): array
    {
        $filters = $this->normalizeFilters($filters);
        $user = $user ?? Auth::user();

        $bookingQ = $this->applyBookingDateRange($this->scopedBookingsQuery($filters, $user), $filters);

        $guestIdsFromBookings = (clone $bookingQ)
            ->whereNotNull('bookings.guest_id')
            ->distinct()
            ->pluck('bookings.guest_id');

        $totalGuestsWithBookings = $guestIdsFromBookings->count();
        $guestsInPeriod = (clone $bookingQ)
            ->select(DB::raw('SUM(bookings.adults + bookings.children) as guest_nights'))
            ->value('guest_nights');

        $newGuests = Guest::query()
            ->whereBetween('created_at', [$filters['date_from'].' 00:00:00', $filters['date_to'].' 23:59:59'])
            ->whereHas('bookings', function ($q) use ($filters, $user) {
                $this->resortAccess->applyResortColumnScope($q, $user, 'resort_id', $filters['resort_id'] ?? null);
                $this->branchAccess->applyBookingBranchScope($q, $user, $filters['branch_id'] ?? null);
            })
            ->count();

        $returningGuests = Guest::query()
            ->whereIn('id', $guestIdsFromBookings)
            ->where('total_stays', '>', 1)
            ->count();

        $byDate = (clone $bookingQ)
            ->select(DB::raw('DATE(bookings.created_at) as date'), DB::raw('SUM(bookings.adults + bookings.children) as guests'))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(fn ($row) => ['date' => $row->date, 'guests' => (int) $row->guests])
            ->values()
            ->all();

        $byResort = (clone $bookingQ)
            ->join('resorts', 'resorts.id', '=', 'bookings.resort_id')
            ->select('resorts.name as resort_name', DB::raw('SUM(bookings.adults + bookings.children) as guests'))
            ->groupBy('resorts.id', 'resorts.name')
            ->orderByDesc('guests')
            ->get()
            ->map(fn ($row) => [
                'resort_name' => $row->resort_name,
                'guests'      => (int) $row->guests,
            ])
            ->values()
            ->all();

        $totalRegistered = Guest::query()->count();

        return [
            'total_registered'     => $totalRegistered,
            'unique_guests'        => $totalGuestsWithBookings,
            'guest_headcount'      => (int) ($guestsInPeriod ?? 0),
            'new_guests'           => (int) $newGuests,
            'returning_guests'     => (int) $returningGuests,
            'by_date'              => $byDate,
            'by_resort'            => $byResort,
        ];
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    public function dailyBreakdown(array $filters, ?User $user, int $page = 1, int $perPage = 15): array
    {
        $filters = $this->normalizeFilters($filters);
        $user = $user ?? Auth::user();

        $from = Carbon::parse($filters['date_from']);
        $to = Carbon::parse($filters['date_to']);
        $days = [];
        foreach (CarbonPeriod::create($from, $to) as $day) {
            $days[] = $day->toDateString();
        }
        $days = array_reverse($days);
        $total = count($days);
        $offset = ($page - 1) * $perPage;
        $pageDays = array_slice($days, $offset, $perPage);

        $bookingCounts = $this->bookingCountsByDate($filters, $user);
        $guestCounts = $this->guestHeadcountByDate($filters, $user);
        $revenueByDate = $this->revenuePaidByDate($filters, $user);
        $pendingByDate = $this->revenuePendingByDate($filters, $user);
        $activeStays = $this->activeStaysByDate($filters, $user, $pageDays);

        $rows = [];
        foreach ($pageDays as $date) {
            $rows[] = [
                'date'         => $date,
                'bookings'     => (int) ($bookingCounts[$date] ?? 0),
                'guests'       => (int) ($guestCounts[$date] ?? 0),
                'revenue'      => round((float) ($revenueByDate[$date] ?? 0), 2),
                'paid'         => round((float) ($revenueByDate[$date] ?? 0), 2),
                'pending'      => round((float) ($pendingByDate[$date] ?? 0), 2),
                'active_stays' => (int) ($activeStays[$date] ?? 0),
                'occupancy'    => null,
            ];
        }

        return [
            'rows' => $rows,
            'pagination' => [
                'page'        => $page,
                'per_page'    => $perPage,
                'total'       => $total,
                'total_pages' => (int) max(1, ceil($total / $perPage)),
            ],
        ];
    }

    /** @param  array<string, mixed>  $filters */
    protected function normalizeFilters(array $filters): array
    {
        $from = $filters['date_from'] ?? null;
        $to = $filters['date_to'] ?? null;

        if (! $from && ! $to) {
            $from = Carbon::now()->startOfMonth()->toDateString();
            $to = Carbon::now()->toDateString();
        } elseif ($from && ! $to) {
            $to = $from;
        } elseif (! $from && $to) {
            $from = $to;
        }

        if (Carbon::parse($from)->diffInDays(Carbon::parse($to)) > 366) {
            $to = Carbon::parse($from)->addDays(366)->toDateString();
        }

        return array_merge($filters, [
            'date_from' => $from,
            'date_to'   => $to,
            'resort_id' => ! empty($filters['resort_id']) ? (int) $filters['resort_id'] : null,
            'branch_id' => ! empty($filters['branch_id']) ? (int) $filters['branch_id'] : null,
        ]);
    }

    /** @param  array<string, mixed>  $filters */
    protected function scopedBookingsQuery(array $filters, ?User $user)
    {
        $query = Booking::query();
        $this->resortAccess->applyResortColumnScope($query, $user, 'resort_id', $filters['resort_id'] ?? null);
        $this->branchAccess->applyBookingBranchScope($query, $user, $filters['branch_id'] ?? null);

        return $query;
    }

    /** @param  array<string, mixed>  $filters */
    protected function scopedRoomsQuery(array $filters, ?User $user)
    {
        $query = Room::query();
        $this->resortAccess->applyResortColumnScope($query, $user, 'resort_id', $filters['resort_id'] ?? null);
        $this->branchAccess->applyBranchColumnScope($query, $user, 'branch_id', $filters['branch_id'] ?? null);

        return $query;
    }

    /** @param  array<string, mixed>  $filters */
    protected function scopedResortPaymentsQuery(array $filters, ?User $user)
    {
        $query = Payment::query()->where(function ($q) {
            $q->where('payments.source', 'resort')
                ->orWhere(function ($legacy) {
                    $legacy->whereNull('payments.source')->whereNotNull('payments.booking_id');
                });
        });

        if ($user && ! $this->resortAccess->bypassesResortScope($user)) {
            $assigned = $this->resortAccess->assignedResortIds($user);
            if ($assigned === []) {
                $query->whereRaw('1 = 0');
            } else {
                $query->whereHas('booking', fn ($b) => $b->whereIn('resort_id', $assigned));
            }
        }

        if (! empty($filters['resort_id'])) {
            $query->whereHas('booking', fn ($b) => $b->where('resort_id', (int) $filters['resort_id']));
        }

        if ($user && ! $this->branchAccess->bypassesBranchScope($user)) {
            $query->whereHas('booking', function ($b) use ($user, $filters) {
                $this->branchAccess->applyBookingBranchScope($b, $user, $filters['branch_id'] ?? null);
            });
        } elseif (! empty($filters['branch_id'])) {
            $branchId = (int) $filters['branch_id'];
            $query->whereHas('booking.rooms', fn ($r) => $r->where('branch_id', $branchId));
        }

        return $query;
    }

    /** @param  array<string, mixed>  $filters */
    protected function applyBookingDateRange($query, array $filters)
    {
        return $query->whereDate('bookings.created_at', '>=', $filters['date_from'])
            ->whereDate('bookings.created_at', '<=', $filters['date_to']);
    }

    /** @param  array<string, mixed>  $filters */
    protected function applyPaymentDateRange($query, array $filters): void
    {
        $query->whereDate('payments.paid_at', '>=', $filters['date_from'])
            ->whereDate('payments.paid_at', '<=', $filters['date_to']);
    }

    /** @param  array<string, mixed>  $filters */
    protected function bookingCountsByDate(array $filters, ?User $user): array
    {
        return $this->applyBookingDateRange($this->scopedBookingsQuery($filters, $user), $filters)
            ->select(DB::raw('DATE(bookings.created_at) as date'), DB::raw('COUNT(*) as count'))
            ->groupBy('date')
            ->pluck('count', 'date')
            ->all();
    }

    /** @param  array<string, mixed>  $filters */
    protected function guestHeadcountByDate(array $filters, ?User $user): array
    {
        return $this->applyBookingDateRange($this->scopedBookingsQuery($filters, $user), $filters)
            ->select(DB::raw('DATE(bookings.created_at) as date'), DB::raw('SUM(bookings.adults + bookings.children) as guests'))
            ->groupBy('date')
            ->pluck('guests', 'date')
            ->all();
    }

    /** @param  array<string, mixed>  $filters */
    protected function revenuePaidByDate(array $filters, ?User $user): array
    {
        $q = $this->scopedResortPaymentsQuery($filters, $user);
        $q->where('payments.status', 'paid')
            ->whereDate('payments.paid_at', '>=', $filters['date_from'])
            ->whereDate('payments.paid_at', '<=', $filters['date_to']);

        return $q->select(DB::raw('DATE(payments.paid_at) as date'), DB::raw('SUM(payments.paid_amount) as revenue'))
            ->groupBy('date')
            ->pluck('revenue', 'date')
            ->all();
    }

    /** @param  array<string, mixed>  $filters */
    protected function revenuePendingByDate(array $filters, ?User $user): array
    {
        $q = $this->scopedResortPaymentsQuery($filters, $user);
        $q->where('payments.status', 'pending')
            ->whereDate('payments.created_at', '>=', $filters['date_from'])
            ->whereDate('payments.created_at', '<=', $filters['date_to']);

        return $q->select(DB::raw('DATE(payments.created_at) as date'), DB::raw('SUM(payments.amount) as pending'))
            ->groupBy('date')
            ->pluck('pending', 'date')
            ->all();
    }

    /**
     * Stays overlapping each calendar day (confirmed / checked_in).
     *
     * @param  array<string, mixed>  $filters
     * @param  string[]  $dates
     */
    protected function activeStaysByDate(array $filters, ?User $user, array $dates): array
    {
        if ($dates === []) {
            return [];
        }

        $base = $this->scopedBookingsQuery($filters, $user)
            ->whereIn('bookings.status', Booking::BLOCKING_STATUSES);

        $result = [];
        foreach ($dates as $date) {
            $result[$date] = (clone $base)
                ->whereDate('bookings.check_in', '<=', $date)
                ->whereDate('bookings.check_out', '>', $date)
                ->count();
        }

        return $result;
    }

    /**
     * Daily occupancy trend from booking stay dates (authoritative for historical occupancy).
     *
     * Snapshot cards use current room.status; this uses overlapping stays on booking_rooms.
     * Sellable denominator uses current room inventory minus rooms in maintenance today
     * (historical maintenance is not stored).
     *
     * @param  array<string, mixed>  $filters  date_from, date_to, resort_id, branch_id
     * @return array<int, array{date: string, label: string, occupied: int, sellable: int, rate: float, active_stays: int}>
     */
    public function occupancyTrend(array $filters, ?User $user = null): array
    {
        $filters = $this->normalizeFilters($filters);
        $user = $user ?? Auth::user();

        $rooms = $this->scopedRoomsQuery($filters, $user);
        $total = (int) (clone $rooms)->count();
        $maintenance = (int) (clone $rooms)->where('status', 'maintenance')->count();
        $sellable = $total - $maintenance;

        $from = Carbon::parse($filters['date_from'])->startOfDay();
        $to = Carbon::parse($filters['date_to'])->startOfDay();

        $stayRows = $this->scopedBookingsQuery($filters, $user)
            ->whereIn('bookings.status', Booking::BLOCKING_STATUSES)
            ->whereDate('bookings.check_in', '<=', $to->toDateString())
            ->whereDate('bookings.check_out', '>', $from->toDateString())
            ->join('booking_rooms', 'booking_rooms.booking_id', '=', 'bookings.id')
            ->select(
                'bookings.check_in',
                'bookings.check_out',
                'booking_rooms.room_id'
            )
            ->get();

        $stays = $stayRows->map(function ($row) {
            return [
                'room_id'   => (int) $row->room_id,
                'check_in'  => Carbon::parse($row->check_in)->toDateString(),
                'check_out' => Carbon::parse($row->check_out)->toDateString(),
            ];
        })->all();

        $step = $from->diffInDays($to) > 60 ? 7 : 1;
        $points = [];
        $cursor = $from->copy();

        while ($cursor->lte($to)) {
            $date = $cursor->toDateString();
            $occupiedRoomIds = [];
            foreach ($stays as $stay) {
                if ($stay['check_in'] <= $date && $stay['check_out'] > $date) {
                    $occupiedRoomIds[$stay['room_id']] = true;
                }
            }
            $occupied = count($occupiedRoomIds);
            $rate = $sellable <= 0
                ? 0.0
                : round(min(100.0, ($occupied / $sellable) * 100), 1);

            $points[] = [
                'date'         => $date,
                'label'        => $cursor->format('M j'),
                'occupied'     => $occupied,
                'sellable'     => $sellable,
                'rate'         => $rate,
                'active_stays' => $occupied,
            ];
            $cursor->addDays($step);
        }

        return $points;
    }

    /** @param  array<string, mixed>  $filters */
    protected function occupancyTrendByDate(array $filters, ?User $user): array
    {
        return $this->occupancyTrend($filters, $user);
    }
}
