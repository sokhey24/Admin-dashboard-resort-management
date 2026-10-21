<?php

namespace App\Listeners;

use App\Events\BookingCreated;
use App\Jobs\NotifyStaffNewBookingJob;
use App\Jobs\SendBookingConfirmationEmailJob;

class DispatchBookingCreatedSideEffects
{
    public function handle(BookingCreated $event): void
    {
        SendBookingConfirmationEmailJob::dispatch($event->bookingId);
        NotifyStaffNewBookingJob::dispatch($event->bookingId);
    }
}
