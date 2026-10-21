<?php

namespace App\Notifications;

use App\Models\Booking;

class BookingCreatedStaffNotification extends RmsDatabaseNotification
{
    public function __construct(protected Booking $booking) {}

    public function preferenceCategory(): string
    {
        return 'booking';
    }

    public function toDatabase(object $notifiable): array
    {
        $this->booking->loadMissing(['user', 'resort']);

        return [
            'category' => 'booking',
            'action' => 'created',
            'title' => 'New booking',
            'message' => ($this->booking->booking_code ?? 'Booking').' · '.($this->booking->user?->name ?? 'Guest'),
            'booking_code' => $this->booking->booking_code,
            'user_name' => $this->booking->user?->name ?? 'Guest',
            'status' => $this->booking->status,
            'entity_type' => 'booking',
            'entity_id' => $this->booking->id,
            'url' => '/booking',
        ];
    }
}
