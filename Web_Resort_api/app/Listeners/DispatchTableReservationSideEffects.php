<?php

namespace App\Listeners;

use App\Events\TableReservationRequested;
use App\Jobs\NotifyStaffTableReservationJob;

class DispatchTableReservationSideEffects
{
    public function handle(TableReservationRequested $event): void
    {
        NotifyStaffTableReservationJob::dispatch($event->tableReservationId);
    }
}
