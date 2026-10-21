<?php

namespace App\Listeners;

use App\Events\ActivityBookingCreated;
use App\Events\BookingCreated;
use App\Events\BookingPaid;
use App\Events\ContactInquiryCreated;
use App\Services\NotificationService;

class PersistDomainNotifications
{
    public function __construct(protected NotificationService $notifications) {}

    public function onBookingCreated(BookingCreated $event): void
    {
        $this->notifications->onBookingCreated($event->bookingId);
    }

    public function onBookingPaid(BookingPaid $event): void
    {
        $this->notifications->onBookingPaid($event->bookingId, $event->paymentId);
    }

    public function onContactInquiryCreated(ContactInquiryCreated $event): void
    {
        $this->notifications->onContactInquiryCreated($event->inquiryId);
    }

    public function onActivityBookingCreated(ActivityBookingCreated $event): void
    {
        $this->notifications->onActivityBookingCreated($event->activityBookingId);
    }
}
