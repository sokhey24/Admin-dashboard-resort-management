<?php

namespace App\Jobs;

use App\Mail\BookingConfirmationMail;
use App\Models\Booking;
use App\Services\DomainTaskGate;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendBookingConfirmationEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public readonly int $bookingId) {}

    public function handle(DomainTaskGate $gate): void
    {
        if (! $gate->claim("booking_confirmation_email:{$this->bookingId}")) {
            return;
        }

        $booking = Booking::with(['user', 'resort', 'rooms.roomType'])->find($this->bookingId);
        if (! $booking) {
            return;
        }

        $email = $booking->user?->email;
        if (! $email) {
            return;
        }

        Mail::to($email)->send(new BookingConfirmationMail($booking));
    }
}
