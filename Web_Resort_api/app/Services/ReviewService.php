<?php

namespace App\Services;

use App\Models\Review;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ReviewService
{
    public const STATUSES = ['pending', 'approved', 'rejected'];

    public function paginate(array $filters, ?User $user = null): LengthAwarePaginator
    {
        $perPage = min(50, max(1, (int) ($filters['per_page'] ?? 10)));

        return $this->filteredQuery($filters, $user)
            ->with([
                'user',
                'room.roomType',
                'room.branch',
                'resort',
                'booking.rooms.roomType',
                'booking.rooms.branch',
            ])
            ->latest()
            ->paginate($perPage);
    }

    public function loadRelations(Review $review): Review
    {
        return $review->load([
            'user',
            'room.roomType',
            'room.branch',
            'resort',
            'booking.rooms.roomType',
            'booking.rooms.branch',
        ]);
    }

    protected function filteredQuery(array $filters, ?User $user = null)
    {
        $query = Review::query();
        $this->applyUserScope($query, $user);
        $search = trim((string) ($filters['search'] ?? ''));

        if ($search !== '') {
            $like = '%'.$search.'%';
            $query->where(function ($q) use ($like) {
                $q->where('title', 'like', $like)
                    ->orWhere('comment', 'like', $like)
                    ->orWhereHas('user', fn ($u) => $u->where('name', 'like', $like)->orWhere('email', 'like', $like))
                    ->orWhereHas('room', fn ($r) => $r->where('room_number', 'like', $like))
                    ->orWhereHas('booking', fn ($b) => $b->where('booking_code', 'like', $like))
                    ->orWhereHas('booking.rooms', fn ($r) => $r->where('room_number', 'like', $like));
            });
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['rating']) && $filters['rating'] !== '' && $filters['rating'] !== null) {
            $query->where('rating', $filters['rating']);
        }

        if (! empty($filters['resort_id'])) {
            $query->where('resort_id', $filters['resort_id']);
        }

        if (! empty($filters['branch_id'])) {
            $branchId = $filters['branch_id'];
            $query->where(function ($q) use ($branchId) {
                $q->whereHas('room', fn ($r) => $r->where('branch_id', $branchId))
                    ->orWhereHas('booking.rooms', fn ($r) => $r->where('branch_id', $branchId));
            });
        }

        if (! empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (! empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        return $query;
    }

    public function assertAccessible(Review $review, User $user): void
    {
        if ($user->roles()->where('name', 'admin')->exists()) {
            return;
        }

        $assigned = $user->resorts()->pluck('resorts.id');
        if ($assigned->isEmpty()) {
            return;
        }

        if (! $assigned->contains((int) $review->resort_id)) {
            abort(403, 'You cannot access reviews for this resort.');
        }
    }

    protected function applyUserScope($query, ?User $user): void
    {
        if (! $user || $user->roles()->where('name', 'admin')->exists()) {
            return;
        }

        $assigned = $user->resorts()->pluck('resorts.id');
        if ($assigned->isNotEmpty()) {
            $query->whereIn('resort_id', $assigned);
        }
    }
}
