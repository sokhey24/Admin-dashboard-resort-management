<?php

namespace App\Policies;

use App\Models\Review;
use App\Models\User;
use App\Services\ReviewService;

class ReviewPolicy
{
    public function view(User $user, Review $review): bool
    {
        return $this->allows($user, $review);
    }

    public function update(User $user, Review $review): bool
    {
        if ($user->isGuestAccount()) {
            return (int) $review->user_id === (int) $user->id;
        }

        return $this->allows($user, $review);
    }

    public function delete(User $user, Review $review): bool
    {
        if ($user->isGuestAccount()) {
            return (int) $review->user_id === (int) $user->id;
        }

        return $this->allows($user, $review);
    }

    protected function allows(User $user, Review $review): bool
    {
        try {
            app(ReviewService::class)->assertAccessible($review, $user);

            return true;
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            return $e->getStatusCode() === 403 ? false : throw $e;
        }
    }
}
