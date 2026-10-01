<?php

namespace App\Console\Commands;

use App\Models\Branch;
use App\Models\Booking;
use App\Models\Resort;
use App\Models\Room;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ConsolidateBrandCommand extends Command
{
    protected $signature = 'resort:consolidate-brand
                            {--dry-run : Print planned changes without writing to the database}';

    protected $description = 'Consolidate legacy resorts into the single Solara brand (branches, rooms, bookings, user_resort).';

    private const PRIMARY_NAME = 'Solara Resort & Spa';

    private const PRIMARY_SLUG = 'solara-resort';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');

        $this->info($dryRun ? 'DRY RUN — no database writes.' : 'Applying consolidation…');
        $this->newLine();

        $counts = [
            'branches_moved' => 0,
            'rooms_branch_fixed' => 0,
            'rooms_resort_aligned' => 0,
            'bookings_backfilled' => 0,
            'resorts_inactivated' => 0,
            'user_resort_migrated' => 0,
            'default_branch_created' => 0,
        ];

        DB::beginTransaction();

        try {
            [$primaryId, $primaryNotes] = $this->ensurePrimaryResort($dryRun);
            foreach ($primaryNotes as $note) {
                $this->line("  • {$note}");
            }
            $this->info("Primary brand resort id: {$primaryId}");
            $this->newLine();

            $counts['branches_moved'] = $this->reassignBranches($primaryId, $dryRun);

            [$defaultBranchId, $created] = $this->resolveDefaultBranch($primaryId, $dryRun);
            if ($created) {
                $counts['default_branch_created'] = 1;
            }
            $this->info("Default branch id: {$defaultBranchId}");

            [$roomsBranch, $roomsResort] = $this->fixOrphanRooms($primaryId, $defaultBranchId, $dryRun);
            $counts['rooms_branch_fixed'] = $roomsBranch;
            $counts['rooms_resort_aligned'] = $roomsResort;

            $counts['bookings_backfilled'] = $this->backfillBookingBranches($dryRun);

            $counts['resorts_inactivated'] = $this->inactivateLegacyResorts($primaryId, $dryRun);

            if (Schema::hasTable('user_resort')) {
                $counts['user_resort_migrated'] = $this->migrateUserResortPivot($primaryId, $dryRun);
            }

            if ($dryRun) {
                DB::rollBack();
                $this->warn('Dry run complete — transaction rolled back.');
            } else {
                DB::commit();
                $this->info('Consolidation committed.');
            }
        } catch (\Throwable $e) {
            DB::rollBack();
            $this->error($e->getMessage());

            return self::FAILURE;
        }

        $this->newLine();
        $this->table(
            ['Metric', 'Count'],
            collect($counts)->map(fn ($v, $k) => [str_replace('_', ' ', $k), $v])->values()->all()
        );

        return self::SUCCESS;
    }

    /**
     * @return array{0: int, 1: list<string>}
     */
    private function ensurePrimaryResort(bool $dryRun): array
    {
        $notes = [];
        $bySlug = Resort::query()->where('slug', self::PRIMARY_SLUG)->first();
        $idOne = Resort::query()->find(1);

        if ($bySlug) {
            $primaryId = (int) $bySlug->id;
            $notes[] = 'Using existing resort with slug '.self::PRIMARY_SLUG." (id {$primaryId}).";

            if ($bySlug->name !== self::PRIMARY_NAME) {
                $notes[] = 'Will update name to "'.self::PRIMARY_NAME.'".';
                if (! $dryRun) {
                    $bySlug->update([
                        'name' => self::PRIMARY_NAME,
                        'status' => 'active',
                    ]);
                }
            }

            return [$primaryId, $notes];
        }

        if ($idOne) {
            $notes[] = 'No slug '.self::PRIMARY_SLUG.' found; updating resort id=1 to primary brand.';
            if ((string) $idOne->slug !== self::PRIMARY_SLUG) {
                $notes[] = "Previous id=1 slug was \"{$idOne->name}\" / {$idOne->slug}.";
            }
            if (! $dryRun) {
                $idOne->update([
                    'name' => self::PRIMARY_NAME,
                    'slug' => self::PRIMARY_SLUG,
                    'status' => 'active',
                ]);
            }

            return [1, $notes];
        }

        $notes[] = 'Creating primary brand resort (no id=1 and no slug match).';
        if ($dryRun) {
            $placeholderId = (int) (Resort::query()->max('id') ?? 0) + 1;

            return [$placeholderId, $notes];
        }

        $created = Resort::query()->create([
            'name' => self::PRIMARY_NAME,
            'slug' => self::PRIMARY_SLUG,
            'address' => 'National Road 6, Head Office',
            'city' => 'Siem Reap',
            'country' => 'Cambodia',
            'email' => 'info@solararesort.com',
            'phone' => '+855 63 000 100',
            'status' => 'active',
        ]);
        $notes[] = "Created resort id {$created->id}.";

        return [(int) $created->id, $notes];
    }

    private function reassignBranches(int $primaryId, bool $dryRun): int
    {
        $query = Branch::query()->where('resort_id', '!=', $primaryId);
        $count = (int) $query->count();

        if ($count > 0) {
            $this->line("Reassigning {$count} branch(es) to resort id {$primaryId}.");
            if (! $dryRun) {
                $query->update(['resort_id' => $primaryId]);
            }
        } else {
            $this->line('All branches already belong to the primary resort.');
        }

        return $count;
    }

    /**
     * @return array{0: int, 1: bool}
     */
    private function resolveDefaultBranch(int $primaryId, bool $dryRun): array
    {
        $branch = Branch::query()
            ->where('resort_id', $primaryId)
            ->orderBy('id')
            ->first();

        if ($branch) {
            return [(int) $branch->id, false];
        }

        $this->line('No branch under primary resort; creating default "Solara Main" branch.');
        if ($dryRun) {
            return [(int) (Branch::query()->max('id') ?? 0) + 1, true];
        }

        $branch = Branch::query()->create([
            'resort_id' => $primaryId,
            'name' => 'Solara Main',
            'slug' => 'solara-main',
            'city' => 'Siem Reap',
            'address' => 'National Road 6, Siem Reap',
            'phone' => '+855 63 000 101',
            'email' => 'stay@siem-reap.solararesort.com',
            'stars' => 5,
            'status' => 'active',
        ]);

        return [(int) $branch->id, true];
    }

    /**
     * @return array{0: int, 1: int}
     */
    private function fixOrphanRooms(int $primaryId, int $defaultBranchId, bool $dryRun): array
    {
        $nullBranchQuery = Room::query()->whereNull('branch_id');
        $branchFixed = (int) $nullBranchQuery->count();
        if ($branchFixed > 0) {
            $this->line("Assigning branch_id {$defaultBranchId} to {$branchFixed} room(s) with NULL branch_id.");
            if (! $dryRun) {
                $nullBranchQuery->update(['branch_id' => $defaultBranchId]);
            }
        }

        $resortAligned = 0;
        $resortSkipped = 0;

        $rooms = Room::query()
            ->with('branch:id,resort_id')
            ->where('resort_id', '!=', $primaryId)
            ->get();

        foreach ($rooms as $room) {
            $targetResortId = $room->branch_id && $room->branch
                ? (int) $room->branch->resort_id
                : $primaryId;

            if ($targetResortId === (int) $room->resort_id) {
                continue;
            }

            $conflict = Room::query()
                ->where('resort_id', $targetResortId)
                ->where('room_number', $room->room_number)
                ->where('id', '!=', $room->id)
                ->exists();

            if ($conflict) {
                $newNumber = $this->uniqueRoomNumberForResort($targetResortId, (string) $room->room_number, (int) $room->id);
                if ($newNumber === null) {
                    $resortSkipped++;
                    $this->warn("Skipping room id {$room->id} ({$room->room_number}): could not resolve duplicate at resort_id {$targetResortId}.");

                    continue;
                }

                $this->line("Room id {$room->id}: rename \"{$room->room_number}\" → \"{$newNumber}\" and set resort_id {$targetResortId}.");
                $resortAligned++;
                if (! $dryRun) {
                    $room->update([
                        'room_number' => $newNumber,
                        'resort_id' => $targetResortId,
                    ]);
                }

                continue;
            }

            $resortAligned++;
            if (! $dryRun) {
                $room->update(['resort_id' => $targetResortId]);
            }
        }

        if ($resortAligned > 0) {
            $this->line("Aligned resort_id on {$resortAligned} room(s) from branch / primary brand.");
        }
        if ($resortSkipped > 0) {
            $this->line("Skipped {$resortSkipped} room(s) due to (resort_id, room_number) conflicts.");
        }

        return [$branchFixed, $resortAligned];
    }

    private function backfillBookingBranches(bool $dryRun): int
    {
        if (! Schema::hasColumn('bookings', 'branch_id')) {
            $this->warn('bookings.branch_id column missing — skipping booking backfill.');

            return 0;
        }

        $bookingIds = Booking::query()
            ->whereNull('branch_id')
            ->pluck('id');

        if ($bookingIds->isEmpty()) {
            $this->line('No bookings with NULL branch_id.');

            return 0;
        }

        $updated = 0;

        foreach ($bookingIds as $bookingId) {
            $branchId = $this->resolveBranchFromBookingRooms((int) $bookingId);
            if ($branchId === null) {
                continue;
            }

            $updated++;
            if (! $dryRun) {
                Booking::query()->where('id', $bookingId)->update(['branch_id' => $branchId]);
            }
        }

        $this->line("Backfilled branch_id on {$updated} booking(s) from booking_rooms.");

        return $updated;
    }

    private function resolveBranchFromBookingRooms(int $bookingId): ?int
    {
        if (! Schema::hasTable('booking_rooms')) {
            return null;
        }

        $branchCounts = DB::table('booking_rooms')
            ->join('rooms', 'rooms.id', '=', 'booking_rooms.room_id')
            ->where('booking_rooms.booking_id', $bookingId)
            ->whereNotNull('rooms.branch_id')
            ->select('rooms.branch_id', DB::raw('COUNT(*) as cnt'))
            ->groupBy('rooms.branch_id')
            ->orderByDesc('cnt')
            ->orderBy('rooms.branch_id')
            ->get();

        if ($branchCounts->isEmpty()) {
            return null;
        }

        return (int) $branchCounts->first()->branch_id;
    }

    private function inactivateLegacyResorts(int $primaryId, bool $dryRun): int
    {
        $query = Resort::query()
            ->where('id', '!=', $primaryId)
            ->where(function ($q) {
                $q->where('name', '!=', self::PRIMARY_NAME)
                    ->orWhere('slug', '!=', self::PRIMARY_SLUG);
            })
            ->where('status', '!=', 'inactive');

        $count = (int) $query->count();

        if ($count === 0) {
            $this->line('No legacy resorts need inactivation.');

            return 0;
        }

        $this->line("Setting status=inactive on {$count} legacy resort(s).");
        if (! $dryRun) {
            $query->update(['status' => 'inactive']);
        }

        if (Schema::hasColumn('resorts', 'archived_at')) {
            $this->line('Note: resorts.archived_at exists but was not set (status=inactive only).');
        }

        return $count;
    }

    private function migrateUserResortPivot(int $primaryId, bool $dryRun): int
    {
        $legacyRows = DB::table('user_resort')
            ->where('resort_id', '!=', $primaryId)
            ->get();

        if ($legacyRows->isEmpty()) {
            $this->line('user_resort: no legacy resort assignments.');

            return 0;
        }

        $migrated = 0;

        foreach ($legacyRows as $row) {
            $hasPrimary = DB::table('user_resort')
                ->where('user_id', $row->user_id)
                ->where('resort_id', $primaryId)
                ->exists();

            if (! $dryRun) {
                if ($hasPrimary) {
                    DB::table('user_resort')
                        ->where('user_id', $row->user_id)
                        ->where('resort_id', $row->resort_id)
                        ->delete();
                } else {
                    DB::table('user_resort')
                        ->where('user_id', $row->user_id)
                        ->where('resort_id', $row->resort_id)
                        ->update(['resort_id' => $primaryId]);
                }
            }

            $migrated++;
        }

        $this->line("user_resort: processed {$migrated} legacy assignment(s) toward resort id {$primaryId}.");

        return $migrated;
    }

    /**
     * Resolve (resort_id, room_number) unique constraint when consolidating legacy rooms.
     */
    private function uniqueRoomNumberForResort(int $resortId, string $roomNumber, int $roomId): ?string
    {
        $candidates = [
            $this->truncateRoomNumber("{$roomNumber}-{$roomId}"),
            $this->truncateRoomNumber("L{$roomId}"),
            "R{$roomId}",
        ];

        foreach ($candidates as $candidate) {
            if ($candidate === '') {
                continue;
            }
            $exists = Room::query()
                ->where('resort_id', $resortId)
                ->where('room_number', $candidate)
                ->where('id', '!=', $roomId)
                ->exists();
            if (! $exists) {
                return $candidate;
            }
        }

        return null;
    }

    private function truncateRoomNumber(string $value): string
    {
        return substr($value, 0, 20);
    }
}
