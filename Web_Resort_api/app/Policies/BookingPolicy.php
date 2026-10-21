<?php

namespace App\Policies;

use App\Models\Booking;
use App\Models\User;
use App\Services\BookingService;

class BookingPolicy
{
    public function view(User $user, Booking $booking): bool
    {
        return $this->allows($user, $booking);
    }

    public function update(User $user, Booking $booking): bool
    {
        return $this->allows($user, $booking);
    }

    public function delete(User $user, Booking $booking): bool
    {
        return $this->allows($user, $booking);
    }

    protected function allows(User $user, Booking $booking): bool
    {
        try {
            app(BookingService::class)->assertAccessible($booking, $user);

            return true;
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            return $e->getStatusCode() === 403 ? false : throw $e;
        }
    }
}
