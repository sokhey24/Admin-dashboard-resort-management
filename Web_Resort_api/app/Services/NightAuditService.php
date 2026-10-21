<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\Booking;
use App\Models\Branch;
use App\Models\DailyAuditReport;
use App\Models\DomainTaskDedupe;
use App\Models\FolioCharge;
use App\Models\Room;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

/**
 * Night audit (end-of-day) metrics for a branch operational date.
 *
 * Formulas (single currency per report — mixed currencies fail the audit):
 * - sellable_rooms = total_rooms − maintenance_rooms (maintenance from current room inventory snapshot).
 * - occupied_rooms = distinct room_ids with a stay overlapping the night (check_in ≤ date < check_out)
 *   and booking status in REVENUE_STATUSES (not cancelled/pending).
 * - occupancy_rate = occupied_rooms / max(1, sellable_rooms) × 100.
 * - room_revenue = Σ price_per_night per occupied room-night (booking_rooms pivot), earned revenue not cash.
 * - incidental_revenue = Σ folio_charges.amount posted on operational_date (non-voided).
 * - rooms_sold = occupied_rooms (room-nights).
 * - ADR = room_revenue / max(1, rooms_sold).
 * - RevPAR = room_revenue / max(1, sellable_rooms).
 * - arrivals = bookings with check_in date = operational_date (after no-show processing).
 * - departures = bookings with check_out date = operational_date.
 */
class NightAuditService
{
    /** @var list<string> */
    public const REVENUE_STATUSES = ['confirmed', 'checked_in', 'checked_out', 'completed'];

    public function __construct(
        protected BookingService $bookings,
    ) {}

    public function operationalTimezone(): string
    {
        return (string) config('night_audit.timezone', 'UTC');
    }

    public function resolveOperationalDate(?string $date = null): Carbon
    {
        $tz = $this->operationalTimezone();

        if ($date) {
            return Carbon::parse($date, $tz)->startOfDay();
        }

        $now = Carbon::now($tz)->startOfDay();
        if (config('night_audit.default_operational_date') === 'previous') {
            return $now->copy()->subDay();
        }

        return $now;
    }

    /**
     * @return Collection<int, DailyAuditReport>
     */
    public function run(?string $operationalDate = null, ?int $branchId = null, ?User $actor = null): Collection
    {
        $date = $this->resolveOperationalDate($operationalDate);
        $dateString = $date->toDateString();

        $branches = Branch::query()
            ->when($branchId, fn ($q) => $q->whereKey($branchId))
            ->where('is_active', true)
            ->orderBy('id')
            ->get();

        if ($branchId && $branches->isEmpty()) {
            throw ValidationException::withMessages([
                'branch_id' => ['Branch not found or inactive.'],
            ]);
        }

        $reports = collect();
        foreach ($branches as $branch) {
            try {
                $reports->push($this->runForBranch($branch, $date, $actor));
            } catch (\Throwable $e) {
                Log::error('Night audit failed for branch', [
                    'branch_id' => $branch->id,
                    'date' => $dateString,
                    'error' => $e->getMessage(),
                ]);
                $reports->push($this->markFailed($branch, $dateString, $e->getMessage()));
            }
        }

        return $reports;
    }

    public function runForBranch(Branch $branch, Carbon $operationalDate, ?User $actor = null): DailyAuditReport
    {
        $dateString = $operationalDate->toDateString();
        $report = DailyAuditReport::query()
            ->where('branch_id', $branch->id)
            ->whereDate('operational_date', $dateString)
            ->first();

        if (! $report) {
            $report = new DailyAuditReport([
                'branch_id' => $branch->id,
                'operational_date' => $dateString,
            ]);
        }

        $report->resort_id = $branch->resort_id;
        $report->status = DailyAuditReport::STATUS_RUNNING;
        $report->error_message = null;
        $report->save();

        try {
            $noShows = $this->processNoShows($branch, $operationalDate, $actor);
            $metrics = $this->computeMetrics($branch, $operationalDate);

            $report->fill($metrics);
            $report->no_show_count = $noShows;
            $report->status = DailyAuditReport::STATUS_COMPLETED;
            $report->generated_at = now();
            $report->run_count = (int) $report->run_count + 1;
            $report->save();

            return $report->fresh(['branch', 'resort']);
        } catch (\Throwable $e) {
            $report->update([
                'status' => DailyAuditReport::STATUS_FAILED,
                'error_message' => $e->getMessage(),
                'run_count' => (int) $report->run_count + 1,
                'generated_at' => now(),
            ]);

            throw $e;
        }
    }

    /**
     * @return array<string, mixed>
     */
    protected function computeMetrics(Branch $branch, Carbon $operationalDate): array
    {
        $date = $operationalDate->toDateString();
        $currency = (string) config('night_audit.currency', 'USD');

        $roomsQuery = Room::query()->where('branch_id', $branch->id);
        $totalRooms = (int) (clone $roomsQuery)->count();
        $maintenance = (int) (clone $roomsQuery)->where('status', 'maintenance')->count();
        $sellable = max(0, $totalRooms - $maintenance);

        $stayRows = Booking::query()
            ->whereIn('bookings.status', self::REVENUE_STATUSES)
            ->whereDate('bookings.check_in', '<=', $date)
            ->whereDate('bookings.check_out', '>', $date)
            ->whereHas('rooms', fn ($r) => $r->where('branch_id', $branch->id))
            ->join('booking_rooms', 'booking_rooms.booking_id', '=', 'bookings.id')
            ->join('rooms', 'rooms.id', '=', 'booking_rooms.room_id')
            ->where('rooms.branch_id', $branch->id)
            ->select(
                'booking_rooms.room_id',
                'booking_rooms.price_per_night',
                'booking_rooms.net_subtotal',
                'booking_rooms.nights'
            )
            ->get();

        $occupiedRoomIds = [];
        $roomRevenue = 0.0;
        $currencies = [];

        foreach ($stayRows as $row) {
            $occupiedRoomIds[(int) $row->room_id] = true;
            $nights = max(1, (int) ($row->nights ?? 1));
            $nightRate = (float) $row->price_per_night;
            if ($nightRate <= 0 && (float) $row->net_subtotal > 0) {
                $nightRate = (float) $row->net_subtotal / $nights;
            }
            $roomRevenue += $nightRate;
        }

        $occupied = count($occupiedRoomIds);
        $occupancyRate = $sellable <= 0
            ? 0.0
            : round(min(100.0, ($occupied / $sellable) * 100), 2);

        $incidental = (float) FolioCharge::query()
            ->whereNull('voided_at')
            ->whereDate('posted_at', $date)
            ->whereHas('folio.booking.rooms', fn ($r) => $r->where('branch_id', $branch->id))
            ->sum('amount');

        $folioCurrencies = FolioCharge::query()
            ->whereNull('voided_at')
            ->whereDate('posted_at', $date)
            ->whereHas('folio.booking.rooms', fn ($r) => $r->where('branch_id', $branch->id))
            ->join('guest_folios', 'guest_folios.id', '=', 'folio_charges.guest_folio_id')
            ->pluck('guest_folios.currency')
            ->filter()
            ->map(fn ($c) => strtoupper((string) $c))
            ->unique()
            ->values()
            ->all();

        foreach ($folioCurrencies as $c) {
            $currencies[$c] = true;
        }

        if (count($currencies) > 1) {
            throw new \RuntimeException(
                'Mixed currencies detected for this branch/date; cannot produce a single-currency audit.'
            );
        }

        if (count($currencies) === 1) {
            $currency = array_key_first($currencies);
        }

        $roomsSold = max(1, $occupied);
        $adr = round($roomRevenue / $roomsSold, 2);
        $revpar = round($roomRevenue / max(1, $sellable), 2);

        $arrivals = (int) Booking::query()
            ->whereIn('status', array_merge(self::REVENUE_STATUSES, ['pending', 'confirmed']))
            ->whereDate('check_in', $date)
            ->whereHas('rooms', fn ($r) => $r->where('branch_id', $branch->id))
            ->count();

        $departures = (int) Booking::query()
            ->whereIn('status', ['checked_out', 'completed', 'checked_in'])
            ->whereDate('check_out', $date)
            ->whereHas('rooms', fn ($r) => $r->where('branch_id', $branch->id))
            ->count();

        $available = max(0, $sellable - $occupied);

        return [
            'currency' => $currency,
            'total_rooms' => $totalRooms,
            'sellable_rooms' => $sellable,
            'occupied_rooms' => $occupied,
            'maintenance_rooms' => $maintenance,
            'available_rooms' => $available,
            'occupancy_rate' => $occupancyRate,
            'room_revenue' => round($roomRevenue, 2),
            'incidental_revenue' => round($incidental, 2),
            'adr' => $adr,
            'revpar' => $revpar,
            'arrivals' => $arrivals,
            'departures' => $departures,
            'metrics_meta' => [
                'formulas' => [
                    'occupancy_rate' => 'occupied_rooms / sellable_rooms × 100',
                    'adr' => 'room_revenue / rooms_sold',
                    'revpar' => 'room_revenue / sellable_rooms',
                    'room_revenue' => 'sum of price_per_night per occupied room-night (earned, not payments)',
                ],
                'rooms_sold' => $occupied,
            ],
        ];
    }

    protected function processNoShows(Branch $branch, Carbon $operationalDate, ?User $actor): int
    {
        if (! config('night_audit.no_show_enabled', true)) {
            return 0;
        }

        $date = $operationalDate->toDateString();
        $actor = $this->auditActor($actor);
        $processed = 0;

        $candidates = Booking::query()
            ->whereIn('status', ['pending', 'confirmed'])
            ->whereNull('checked_in_at')
            ->whereDate('check_in', $date)
            ->whereHas('rooms', fn ($r) => $r->where('branch_id', $branch->id))
            ->get();

        foreach ($candidates as $booking) {
            $dedupeKey = 'night_audit:no_show:'.$booking->id.':'.$date;
            if (DomainTaskDedupe::query()->where('task_key', $dedupeKey)->exists()) {
                continue;
            }

            DB::transaction(function () use ($booking, $actor, $dedupeKey, &$processed) {
                DomainTaskDedupe::query()->create([
                    'task_key' => $dedupeKey,
                    'created_at' => now(),
                ]);

                $this->bookings->transitionStatus(
                    $booking->fresh(),
                    'cancelled',
                    $actor,
                    'No-show (automated night audit)'
                );

                ActivityLog::create([
                    'user_id' => $actor?->id,
                    'action' => 'night_audit.no_show',
                    'model_type' => Booking::class,
                    'model_id' => $booking->id,
                    'description' => 'Booking marked no-show by night audit',
                    'changes' => ['status' => 'cancelled', 'reason' => 'no_show'],
                    'ip_address' => request()?->ip() ?? '',
                    'user_agent' => request()?->userAgent() ?? 'night-audit',
                ]);

                $this->applyNoShowPenaltyIfConfigured($booking->fresh());

                $processed++;
            });
        }

        return $processed;
    }

    protected function applyNoShowPenaltyIfConfigured(Booking $booking): void
    {
        if (! config('night_audit.no_show_penalty_enabled', false)) {
            return;
        }

        $nights = (int) config('night_audit.no_show_penalty_nights', 0);
        if ($nights <= 0) {
            return;
        }

        // Authorized rule only: keep balance_due at least one night room charge (no new fee types).
        $booking->loadMissing('rooms');
        $perNight = (float) $booking->rooms->avg('pivot.price_per_night');
        if ($perNight <= 0 && $booking->nights > 0) {
            $perNight = (float) $booking->total_amount / max(1, (int) $booking->nights);
        }
        $minimumDue = round($perNight * $nights, 2);
        if ($minimumDue > (float) $booking->balance_due) {
            $booking->update([
                'balance_due' => $minimumDue,
                'internal_notes' => trim(($booking->internal_notes ?? '')."\n[Night audit] No-show minimum due: {$minimumDue}"),
            ]);
        }
    }

    protected function auditActor(?User $actor): User
    {
        if ($actor) {
            return $actor;
        }

        $id = config('night_audit.system_user_id');
        if ($id && ($user = User::find($id))) {
            return $user;
        }

        return User::firstOrCreate(
            ['email' => 'night-audit@system.local'],
            [
                'name' => 'Night Audit System',
                'password' => bcrypt(str()->random(40)),
            ]
        );
    }

    protected function markFailed(Branch $branch, string $dateString, string $message): DailyAuditReport
    {
        $report = DailyAuditReport::query()
            ->where('branch_id', $branch->id)
            ->whereDate('operational_date', $dateString)
            ->first();

        if (! $report) {
            $report = new DailyAuditReport([
                'branch_id' => $branch->id,
                'operational_date' => $dateString,
            ]);
        }
        $report->resort_id = $branch->resort_id;
        $report->status = DailyAuditReport::STATUS_FAILED;
        $report->error_message = $message;
        $report->generated_at = now();
        $report->run_count = (int) $report->run_count + 1;
        $report->save();

        return $report;
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public function listReports(array $filters, ?User $user): array
    {
        $query = DailyAuditReport::query()
            ->with(['branch:id,name,resort_id', 'resort:id,name'])
            ->orderByDesc('operational_date')
            ->orderByDesc('id');

        if (! empty($filters['branch_id'])) {
            $query->where('branch_id', (int) $filters['branch_id']);
        }
        if (! empty($filters['resort_id'])) {
            $query->where('resort_id', (int) $filters['resort_id']);
        }
        if (! empty($filters['date_from'])) {
            $query->whereDate('operational_date', '>=', $filters['date_from']);
        }
        if (! empty($filters['date_to'])) {
            $query->whereDate('operational_date', '<=', $filters['date_to']);
        }
        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        $perPage = min(50, max(1, (int) ($filters['per_page'] ?? 15)));
        $page = max(1, (int) ($filters['page'] ?? 1));

        $paginator = $query->paginate($perPage, ['*'], 'page', $page);

        return [
            'rows' => $paginator->items(),
            'pagination' => [
                'page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'total_pages' => $paginator->lastPage(),
            ],
        ];
    }
}
