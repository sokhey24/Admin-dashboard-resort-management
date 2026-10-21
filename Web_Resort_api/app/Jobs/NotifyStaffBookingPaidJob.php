<?php

namespace App\Jobs;

use App\Mail\StaffBookingAlertMail;
use App\Models\Booking;
use App\Models\Payment;
use App\Services\DomainTaskGate;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class NotifyStaffBookingPaidJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public readonly int $bookingId,
        public readonly int $paymentId,
    ) {}

    public function handle(DomainTaskGate $gate): void
    {
        if (! $gate->claim("staff_booking_paid:{$this->paymentId}")) {
            return;
        }

        $payment = Payment::find($this->paymentId);
        $booking = Booking::with(['user', 'resort'])->find($this->bookingId);
        if (! $payment || ! $booking) {
            return;
        }

        $inbox = (string) config('services.resort.staff_inbox');
        if ($inbox === '') {
            return;
        }

        Mail::to($inbox)->send(new StaffBookingAlertMail($booking, 'paid', $payment));
    }
}
