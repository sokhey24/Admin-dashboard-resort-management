<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class PasswordResetOtpMail extends Mailable
{

    public function __construct(
        public readonly string $userName,
        public readonly string $otp,
        public readonly int    $expiresInMinutes = 10
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your RMS Password Reset Verification Code',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.password-reset-otp',
        );
    }
}
