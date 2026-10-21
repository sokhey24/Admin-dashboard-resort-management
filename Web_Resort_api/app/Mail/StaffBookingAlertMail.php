<?php

namespace App\Mail;

use App\Models\Booking;
use App\Models\Payment;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class StaffBookingAlertMail extends Mailable
{
    public function __construct(
        public readonly Booking $booking,
        public readonly string $kind,
        public readonly ?Payment $payment = null,
    ) {}

    public function envelope(): Envelope
    {
        $code = $this->booking->booking_code ?? (string) $this->booking->id;
        $subject = $this->kind === 'paid'
            ? "Payment received — {$code}"
            : "New booking — {$code}";

        return new Envelope(subject: $subject);
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.staff-booking-alert',
        );
    }
}
