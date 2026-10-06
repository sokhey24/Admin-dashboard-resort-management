<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Review;
use App\Models\Room;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Validation\ValidationException;

class ReviewService
{
    public const STATUSES = ['pending', 'approved', 'rejected'];

    public const REVIEWABLE_BOOKING_STATUSES = ['completed', 'checked_out'];

    public function paginate(array $filters, ?User $user = null): LengthAwarePaginator
    {
        $filters = $this->normalizeListFilters($filters, $user);
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

        if (($filters['scope'] ?? '') === 'mine') {
            if (! $user) {
                $query->whereRaw('1 = 0');

                return $query;
            }
            $query->where('user_id', $user->id);
        }

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

    /**
     * Public and website-customer list access is approved-only.
     */
    public function normalizeListFilters(array $filters, ?User $user = null): array
    {
        if (($filters['scope'] ?? '') === 'mine' && $user?->isGuestAccount()) {
            return $filters;
        }

        if ($this->isPublicReviewConsumer($user)) {
            $filters['status'] = 'approved';
        }

        return $filters;
    }

    public function isPublicReviewConsumer(?User $user): bool
    {
        if (! $user) {
            return true;
        }

        if ($user->roles()->where('name', 'admin')->exists()) {
            return false;
        }

        $assigned = $user->resorts()->pluck('resorts.id');
        if ($assigned->isNotEmpty()) {
            return false;
        }

        return true;
    }

    public function createCustomerReview(User $user, array $data): Review
    {
        $room = Room::query()->findOrFail($data['room_id']);
        $booking = $this->resolveEligibleBookingForRoom($user, $room);

        $exists = Review::query()
            ->where('user_id', $user->id)
            ->where('booking_id', $booking->id)
            ->where('room_id', $room->id)
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'room_id' => ['You have already reviewed this room for this stay.'],
            ]);
        }

        return Review::create([
            'user_id' => $user->id,
            'booking_id' => $booking->id,
            'room_id' => $room->id,
            'resort_id' => $room->resort_id,
            'rating' => (int) $data['rating'],
            'title' => $data['title'] ?? null,
            'comment' => $data['comment'],
            'status' => 'pending',
        ]);
    }

    public function resolveEligibleBookingForRoom(User $user, Room $room): Booking
    {
        $booking = Booking::query()
            ->where('user_id', $user->id)
            ->whereIn('status', self::REVIEWABLE_BOOKING_STATUSES)
            ->whereHas('rooms', fn ($q) => $q->where('rooms.id', $room->id))
            ->latest('check_out')
            ->first();

        if (! $booking) {
            throw ValidationException::withMessages([
                'room_id' => ['You can only review a room from a completed stay that belongs to you.'],
            ]);
        }

        return $booking;
    }

    /**
     * @return array{can_review: bool, rooms: list<array{room_id: int, room_number: string|null, room_type_name: string|null, already_reviewed: bool}>}
     */
    public function bookingReviewEligibility(Booking $booking, User $user): array
    {
        if ((int) $booking->user_id !== (int) $user->id) {
            return ['can_review' => false, 'rooms' => []];
        }

        if (! in_array($booking->status, self::REVIEWABLE_BOOKING_STATUSES, true)) {
            return ['can_review' => false, 'rooms' => []];
        }

        $rooms = $booking->relationLoaded('rooms') ? $booking->rooms : $booking->rooms()->with('roomType')->get();
        $reviewedRoomIds = Review::query()
            ->where('user_id', $user->id)
            ->where('booking_id', $booking->id)
            ->pluck('room_id')
            ->map(fn ($id) => (int) $id)
            ->all();

        $eligibleRooms = [];
        foreach ($rooms as $room) {
            $roomId = (int) $room->id;
            $already = in_array($roomId, $reviewedRoomIds, true);
            $eligibleRooms[] = [
                'room_id' => $roomId,
                'room_number' => $room->room_number,
                'room_type_name' => $room->roomType?->name,
                'already_reviewed' => $already,
            ];
        }

        $canReview = collect($eligibleRooms)->contains(fn ($row) => ! $row['already_reviewed']);

        return [
            'can_review' => $canReview,
            'rooms' => $eligibleRooms,
        ];
    }

    public function assertCustomerOwnsReview(Review $review, User $user): void
    {
        if ((int) $review->user_id !== (int) $user->id) {
            abort(403, 'You cannot access this review.');
        }
    }

    /**
     * @return array{average_rating: float, total_reviews: int}
     */
    public function approvedPublicSummary(?User $user, array $filters = []): array
    {
        $summaryFilters = $filters;
        unset($summaryFilters['page'], $summaryFilters['per_page'], $summaryFilters['scope']);
        $summaryFilters['status'] = 'approved';

        $query = $this->filteredQuery(
            $this->normalizeListFilters($summaryFilters, $user),
            $user
        );

        return [
            'average_rating' => round((float) ($query->avg('rating') ?? 0), 2),
            'total_reviews' => (int) $query->count(),
        ];
    }

    public function updateCustomerReview(Review $review, User $user, array $data): Review
    {
        $this->assertCustomerOwnsReview($review, $user);

        if ($review->status !== 'pending') {
            throw ValidationException::withMessages([
                'status' => ['Only pending reviews can be edited.'],
            ]);
        }

        $review->update([
            'rating' => isset($data['rating']) ? (int) $data['rating'] : $review->rating,
            'title' => array_key_exists('title', $data) ? $data['title'] : $review->title,
            'comment' => $data['comment'] ?? $review->comment,
        ]);

        return $review->fresh();
    }

    public function deleteCustomerReview(Review $review, User $user): void
    {
        $this->assertCustomerOwnsReview($review, $user);

        if ($review->status === 'approved') {
            throw ValidationException::withMessages([
                'status' => ['Published reviews cannot be deleted. Contact the resort if you need changes.'],
            ]);
        }

        $review->delete();
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
