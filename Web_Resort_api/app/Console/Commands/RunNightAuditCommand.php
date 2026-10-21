<?php

namespace App\Console\Commands;

use App\Models\Branch;
use App\Models\DailyAuditReport;
use App\Services\NightAuditService;
use Illuminate\Console\Command;

class RunNightAuditCommand extends Command
{
    protected $signature = 'resort:night-audit
                            {--date= : Operational date (Y-m-d) in night-audit timezone}
                            {--branch= : Branch ID (omit to run all active branches)}';

    protected $description = 'Run end-of-day night audit: metrics snapshot and eligible no-show processing';

    public function handle(NightAuditService $audit): int
    {
        $dateOption = $this->option('date');
        $branchOption = $this->option('branch');

        if ($dateOption && ! preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) $dateOption)) {
            $this->error('Invalid --date. Use Y-m-d format.');

            return self::INVALID;
        }

        $branchId = null;
        if ($branchOption !== null && $branchOption !== '') {
            $branchId = (int) $branchOption;
            if (! Branch::query()->whereKey($branchId)->exists()) {
                $this->error("Branch {$branchId} not found.");

                return self::INVALID;
            }
        }

        $operationalDate = $audit->resolveOperationalDate($dateOption ?: null);
        $this->info('Night audit for operational date '.$operationalDate->toDateString()
            .' ('.$audit->operationalTimezone().')');

        $reports = $audit->run($dateOption ?: null, $branchId, null);

        $failed = $reports->where('status', DailyAuditReport::STATUS_FAILED)->count();
        $completed = $reports->where('status', DailyAuditReport::STATUS_COMPLETED)->count();

        foreach ($reports as $report) {
            $branchName = $report->branch?->name ?? 'Branch #'.$report->branch_id;
            $line = sprintf(
                '[%s] %s — occ %s%% rooms %d/%d revenue %s %s no-shows %d',
                $report->status,
                $branchName,
                number_format((float) $report->occupancy_rate, 1),
                $report->occupied_rooms,
                $report->sellable_rooms,
                number_format((float) $report->room_revenue, 2),
                $report->currency,
                $report->no_show_count
            );
            if ($report->status === DailyAuditReport::STATUS_FAILED) {
                $this->error($line.' — '.$report->error_message);
            } else {
                $this->line($line);
            }
        }

        if ($failed > 0 && $completed === 0) {
            return self::FAILURE;
        }

        if ($failed > 0) {
            return 2;
        }

        return self::SUCCESS;
    }
}
