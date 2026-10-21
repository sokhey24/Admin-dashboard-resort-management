<?php

namespace App\Notifications;

use App\Models\Booking;

class BookingCreatedGuestNotification extends RmsDatabaseNotification
{
    public function __construct(protected Booking $booking) {}

    public function preferenceCategory(): string
    {
        return 'booking';
    }

    public function toDatabase(object $notifiable): array
    {
        $this->booking->loadMissing(['resort', 'rooms.roomType']);
        $room = $this->booking->rooms->first();
        $roomName = $room?->roomType?->name ?? $room?->room_number ?? 'Room';

        return [
            'category' => 'booking',
            'action' => 'created',
            'title' => 'Reservation received',
            'message' => $roomName.' · '.($this->booking->resort?->name ?? 'Solara Resort'),
            'booking_code' => $this->booking->booking_code,
            'user_name' => $notifiable->name ?? 'Guest',
            'status' => $this->booking->status,
            'entity_type' => 'booking',
            'entity_id' => $this->booking->id,
            'url' => '/account/bookings',
        ];
    }
}
