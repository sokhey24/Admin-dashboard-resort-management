<?php

namespace App\Policies;

use App\Models\Payment;
use App\Models\User;
use App\Services\PaymentService;

class PaymentPolicy
{
    public function view(User $user, Payment $payment): bool
    {
        return $this->allowsRead($user, $payment);
    }

    public function update(User $user, Payment $payment): bool
    {
        if ($user->isGuestAccount()) {
            return false;
        }

        return $this->allowsRead($user, $payment);
    }

    public function delete(User $user, Payment $payment): bool
    {
        if ($user->isGuestAccount()) {
            return false;
        }

        return $this->allowsRead($user, $payment);
    }

    protected function allowsRead(User $user, Payment $payment): bool
    {
        try {
            app(PaymentService::class)->assertAccessible($payment, $user);

            return true;
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            return $e->getStatusCode() === 403 ? false : throw $e;
        }
    }
}
