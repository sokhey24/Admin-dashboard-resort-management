<?php

namespace App\Services;

use App\Models\ActivityBooking;
use App\Models\Booking;
use App\Models\ContactInquiry;
use App\Models\Payment;
use App\Models\User;
use App\Notifications\ActivityBookingStaffNotification;
use App\Notifications\BookingCreatedGuestNotification;
use App\Notifications\BookingCreatedStaffNotification;
use App\Notifications\BookingPaidGuestNotification;
use App\Notifications\BookingPaidStaffNotification;
use App\Notifications\ContactInquiryStaffNotification;
use App\Notifications\RmsDatabaseNotification;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Collection;

class NotificationService
{
    public function __construct(
        protected DomainTaskGate $dedupe,
        protected BookingService $bookings,
        protected GuestInquiryScopeService $inquiryScope,
    ) {}

    public function notifyUser(User $user, RmsDatabaseNotification $notification, string $dedupeKey): void
    {
        if (! $this->userAcceptsCategory($user, $notification->preferenceCategory())) {
            return;
        }

        if (! $this->dedupe->claim("in_app:{$dedupeKey}:user:{$user->id}")) {
            return;
        }

        $user->notify($notification);
    }

    /**
     * @param  string[]  $permissions  Any one permission grants eligibility.
     */
    public function notifyRole(array $permissions, RmsDatabaseNotification $notification, string $dedupeKey, ?callable $filter = null): void
    {
        foreach ($this->usersWithAnyPermission($permissions) as $user) {
            if ($filter && ! $filter($user)) {
                continue;
            }
            $this->notifyUser($user, $notification, "{$dedupeKey}:role");
        }
    }

    public function paginateForUser(User $user, array $filters = []): LengthAwarePaginator
    {
        $perPage = min(50, max(1, (int) ($filters['per_page'] ?? 20)));
        $query = $user->notifications()->latest();

        if (! empty($filters['unread_only']) || ($filters['unread'] ?? null) === '1') {
            $query->whereNull('read_at');
        }

        return $query->paginate($perPage);
    }

    public function unreadCountForUser(User $user): int
    {
        return (int) $user->unreadNotifications()->count();
    }

    public function markAsRead(User $user, string $notificationId): DatabaseNotification
    {
        $notification = $user->notifications()->whereKey($notificationId)->firstOrFail();
        if ($notification->read_at === null) {
            $notification->markAsRead();
        }

        return $notification->fresh();
    }

    public function markAllAsRead(User $user): int
    {
        $count = $user->unreadNotifications()->count();
        $user->unreadNotifications->markAsRead();

        return $count;
    }

    public function onBookingCreated(int $bookingId): void
    {
        $booking = Booking::with(['user', 'resort', 'rooms'])->find($bookingId);
        if (! $booking) {
            return;
        }

        $staffNotification = new BookingCreatedStaffNotification($booking);
        $this->notifyRole(
            ['resort.bookings.view', 'admin.resorts.view'],
            $staffNotification,
            "booking_created:{$booking->id}",
            fn (User $user) => $this->staffCanAccessBooking($user, $booking)
        );

        $guest = $booking->user;
        if ($guest) {
            $this->notifyUser(
                $guest,
                new BookingCreatedGuestNotification($booking),
                "booking_created_guest:{$booking->id}"
            );
        }
    }

    public function onBookingPaid(int $bookingId, int $paymentId): void
    {
        $booking = Booking::with(['user'])->find($bookingId);
        $payment = Payment::find($paymentId);
        if (! $booking || ! $payment) {
            return;
        }

        $staffNotification = new BookingPaidStaffNotification($booking, $payment);
        $this->notifyRole(
            ['resort.payments.view', 'payments.view', 'admin.resorts.view'],
            $staffNotification,
            "booking_paid:{$payment->id}",
            fn (User $user) => $this->staffCanAccessBooking($user, $booking)
        );

        $guest = $booking->user;
        if ($guest) {
            $this->notifyUser(
                $guest,
                new BookingPaidGuestNotification($booking, $payment),
                "booking_paid_guest:{$payment->id}"
            );
        }
    }

    public function onContactInquiryCreated(int $inquiryId): void
    {
        $inquiry = ContactInquiry::find($inquiryId);
        if (! $inquiry) {
            return;
        }

        $notification = new ContactInquiryStaffNotification($inquiry);
        $this->notifyRole(
            ['resort.guests.view', 'admin.resorts.view'],
            $notification,
            "contact_inquiry:{$inquiry->id}",
            function (User $user) use ($inquiry) {
                $allowed = $this->inquiryScope->allowedResortNames($user);
                if ($allowed === null) {
                    return true;
                }
                if ($allowed === []) {
                    return false;
                }

                return in_array((string) $inquiry->resort_name, $allowed, true);
            }
        );
    }

    public function onActivityBookingCreated(int $activityBookingId): void
    {
        $activityBooking = ActivityBooking::find($activityBookingId);
        if (! $activityBooking) {
            return;
        }

        $notification = new ActivityBookingStaffNotification($activityBooking);
        $this->notifyRole(
            ['resort.guests.view', 'admin.resorts.view'],
            $notification,
            "activity_booking:{$activityBooking->id}"
        );
    }

    protected function staffCanAccessBooking(User $user, Booking $booking): bool
    {
        if ($user->isGuestAccount()) {
            return false;
        }

        try {
            $this->bookings->assertAccessible($booking, $user);

            return true;
        } catch (\Throwable) {
            return false;
        }
    }

    /**
     * @param  string[]  $permissions
     * @return Collection<int, User>
     */
    protected function usersWithAnyPermission(array $permissions): Collection
    {
        return User::query()
            ->whereHas('roles')
            ->get()
            ->filter(function (User $user) use ($permissions) {
                if ($user->isGuestAccount()) {
                    return false;
                }
                foreach ($permissions as $permission) {
                    if ($user->hasPermission($permission)) {
                        return true;
                    }
                }

                return false;
            })
            ->values();
    }

    protected function userAcceptsCategory(User $user, string $category): bool
    {
        $prefs = is_array($user->preferences) ? $user->preferences : [];
        $notifications = $prefs['notifications'] ?? [];

        if (! is_array($notifications)) {
            return true;
        }

        if (! array_key_exists($category, $notifications)) {
            return true;
        }

        return (bool) $notifications[$category];
    }
}
