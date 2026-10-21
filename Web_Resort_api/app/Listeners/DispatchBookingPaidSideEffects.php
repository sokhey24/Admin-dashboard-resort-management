<?php

namespace App\Listeners;

use App\Events\BookingPaid;
use App\Jobs\GenerateInvoicePdfJob;
use App\Jobs\NotifyStaffBookingPaidJob;

class DispatchBookingPaidSideEffects
{
    public function handle(BookingPaid $event): void
    {
        GenerateInvoicePdfJob::dispatch($event->paymentId);
        NotifyStaffBookingPaidJob::dispatch($event->bookingId, $event->paymentId);
    }
}
