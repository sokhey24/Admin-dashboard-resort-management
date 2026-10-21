<?php

namespace App\Jobs;

use App\Mail\StaffTableReservationMail;
use App\Models\TableReservation;
use App\Services\DomainTaskGate;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class NotifyStaffTableReservationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public readonly int $tableReservationId) {}

    public function handle(DomainTaskGate $gate): void
    {
        if (! $gate->claim("staff_table_reservation:{$this->tableReservationId}")) {
            return;
        }

        $reservation = TableReservation::find($this->tableReservationId);
        if (! $reservation) {
            return;
        }

        $inbox = (string) config('services.resort.staff_inbox');
        if ($inbox === '') {
            return;
        }

        Mail::to($inbox)->send(new StaffTableReservationMail($reservation));
    }
}
