<?php

namespace App\Notifications;

use App\Models\ActivityBooking;

class ActivityBookingStaffNotification extends RmsDatabaseNotification
{
    public function __construct(protected ActivityBooking $activityBooking) {}

    public function preferenceCategory(): string
    {
        return 'system';
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'category' => 'activity',
            'action' => 'created',
            'title' => 'Activity booking request',
            'message' => $this->activityBooking->activity_title.' · '.$this->activityBooking->guest_name,
            'booking_code' => null,
            'user_name' => $this->activityBooking->guest_name,
            'status' => $this->activityBooking->status,
            'entity_type' => 'activity_booking',
            'entity_id' => $this->activityBooking->id,
            'url' => '/resort/guest-inbox',
        ];
    }
}
