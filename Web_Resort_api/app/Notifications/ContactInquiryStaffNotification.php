<?php

namespace App\Notifications;

use App\Models\ContactInquiry;

class ContactInquiryStaffNotification extends RmsDatabaseNotification
{
    public function __construct(protected ContactInquiry $inquiry) {}

    public function preferenceCategory(): string
    {
        return 'system';
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'category' => 'inquiry',
            'action' => 'created',
            'title' => 'New contact inquiry',
            'message' => $this->inquiry->subject.' · '.$this->inquiry->guest_name,
            'booking_code' => null,
            'user_name' => $this->inquiry->guest_name,
            'status' => $this->inquiry->status,
            'entity_type' => 'contact_inquiry',
            'entity_id' => $this->inquiry->id,
            'url' => '/resort/guest-inbox',
        ];
    }
}
