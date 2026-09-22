<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\Room;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Validation\ValidationException;

class RoomService
{
    public const STATUSES = ['available', 'occupied', 'maintenance', 'reserved'];
    public const ACTIVE_BOOKING_STATUSES = ['confirmed', 'checked_in'];

    public function paginate(array $filters): LengthAwarePaginator
    {
        $query = $this->filteredQuery($filters)
            ->with(['roomType', 'branch', 'images', 'resort.facilities'])
            ->latest();

        $perPage = min(50, max(1, (int) ($filters['per_page'] ?? 10)));
        return $query->paginate($perPage);
    }

    public function stats(array $filters): array
    {
        $withoutStatus = $filters;
        unset($withoutStatus['status']);
        $counts = $this->filteredQuery($withoutStatus)
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $result = [];
        foreach (self::STATUSES as $status) {
            $result[$status] = (int) ($counts[$status] ?? 0);
        }
        $result['total'] = array_sum($result);
        return $result;
    }

    public function assertWritable(array $data, ?Room $room = null): void
    {
        $resortId = $data['resort_id'] ?? $room?->resort_id;
        $branchId = array_key_exists('branch_id', $data) ? $data['branch_id'] : $room?->branch_id;

        if ($branchId && $resortId) {
            $belongs = Branch::query()
                ->where('id', $branchId)
                ->where('resort_id', $resortId)
                ->exists();
            if (! $belongs) {
                throw ValidationException::withMessages([
                    'branch_id' => ['The selected branch does not belong to this resort.'],
                ]);
            }
        }

        if (isset($data['status'])) {
            $this->assertStatusChange($room, $data['status']);
        }
    }

    public function assertStatusChange(?Room $room, string $status): void
    {
        if (! in_array($status, self::STATUSES, true)) {
            throw ValidationException::withMessages(['status' => ['Invalid room status.']]);
        }
        if ($room && $status === 'available' && $this->hasBlockingBooking($room)) {
            throw ValidationException::withMessages([
                'status' => ['This room cannot be set to available while it has a confirmed or checked-in booking.'],
            ]);
        }
    }

    public function hasBlockingBooking(Room $room): bool
    {
        return $room->bookings()
            ->whereIn('bookings.status', self::ACTIVE_BOOKING_STATUSES)
            ->exists();
    }

    protected function filteredQuery(array $filters)
    {
        $query = Room::query();
        $search = trim((string) ($filters['search'] ?? ''));
        if ($search !== '') {
            $like = '%'.$search.'%';
            $query->where(function ($q) use ($like) {
                $q->where('room_number', 'like', $like)
                    ->orWhere('notes', 'like', $like)
                    ->orWhere('view', 'like', $like)
                    ->orWhereHas('roomType', fn ($t) => $t->where('name', 'like', $like))
                    ->orWhereHas('branch', fn ($b) => $b->where('name', 'like', $like))
                    ->orWhereHas('resort', fn ($r) => $r->where('name', 'like', $like));
            });
        }
        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        if (! empty($filters['room_type_id'])) {
            $query->where('room_type_id', $filters['room_type_id']);
        }
        if (! empty($filters['resort_id'])) {
            $query->where('resort_id', $filters['resort_id']);
        }
        if (! empty($filters['active_resorts_only'])) {
            $query->whereHas('resort', fn ($r) => $r->where('status', 'active'));
            $query->whereHas('roomType', fn ($t) => $t->where('status', 'active'));
        }
        if (! empty($filters['branch_id'])) {
            $query->where('branch_id', $filters['branch_id']);
        }
        if (! empty($filters['check_in']) && ! empty($filters['check_out'])) {
            $checkIn = \Carbon\Carbon::parse($filters['check_in'])->startOfDay();
            $checkOut = \Carbon\Carbon::parse($filters['check_out'])->startOfDay();
            $busyIds = app(\App\Services\BookingService::class)->busyRoomIds(
                $checkIn,
                $checkOut,
                isset($filters['exclude_booking_id']) ? (int) $filters['exclude_booking_id'] : null
            );
            $query->where('status', '!=', 'maintenance');
            if ($busyIds !== []) {
                $query->whereNotIn('id', $busyIds);
            }
        }
        return $query;
    }
}
