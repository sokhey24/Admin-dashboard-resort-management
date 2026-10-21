<?php

namespace App\Notifications;

use App\Models\Booking;
use App\Models\Payment;

class BookingPaidStaffNotification extends RmsDatabaseNotification
{
    public function __construct(
        protected Booking $booking,
        protected Payment $payment,
    ) {}

    public function preferenceCategory(): string
    {
        return 'payment';
    }

    public function toDatabase(object $notifiable): array
    {
        $this->booking->loadMissing(['user']);

        return [
            'category' => 'payment',
            'action' => 'updated',
            'title' => 'Payment received',
            'message' => ($this->booking->booking_code ?? 'Booking').' · $'.number_format((float) $this->payment->paid_amount, 2),
            'booking_code' => $this->booking->booking_code,
            'user_name' => $this->booking->user?->name ?? 'Guest',
            'status' => $this->booking->status,
            'entity_type' => 'booking',
            'entity_id' => $this->booking->id,
            'url' => '/payment-room',
        ];
    }
}
