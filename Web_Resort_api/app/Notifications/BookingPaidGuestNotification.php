<?php

namespace App\Notifications;

use App\Models\Booking;
use App\Models\Payment;

class BookingPaidGuestNotification extends RmsDatabaseNotification
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
        return [
            'category' => 'payment',
            'action' => 'updated',
            'title' => 'Payment confirmed',
            'message' => 'Your payment of $'.number_format((float) $this->payment->paid_amount, 2)
                .' for '.($this->booking->booking_code ?? 'your stay').' was received.',
            'booking_code' => $this->booking->booking_code,
            'user_name' => $notifiable->name ?? 'Guest',
            'status' => $this->booking->status,
            'entity_type' => 'booking',
            'entity_id' => $this->booking->id,
            'url' => '/account/bookings',
        ];
    }
}
