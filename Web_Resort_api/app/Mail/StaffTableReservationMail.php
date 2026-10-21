<?php

namespace App\Mail;

use App\Models\TableReservation;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class StaffTableReservationMail extends Mailable
{
    public function __construct(public readonly TableReservation $reservation) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'New table reservation request',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.staff-table-reservation',
        );
    }
}
