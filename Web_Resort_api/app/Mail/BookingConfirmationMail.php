<?php

namespace App\Mail;

use App\Models\Booking;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class BookingConfirmationMail extends Mailable
{
    public function __construct(public readonly Booking $booking) {}

    public function envelope(): Envelope
    {
        $code = $this->booking->booking_code ?? (string) $this->booking->id;

        return new Envelope(
            subject: "Booking received — {$code}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.booking-confirmation',
        );
    }
}
