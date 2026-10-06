<?php

namespace App\Services;

use App\Exceptions\RoomUnavailableException;
use App\Models\Booking;
use App\Models\BookingStatusLog;
use App\Models\Coupon;
use App\Models\Room;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class BookingService
{
    public function __construct(
        protected PricingService $pricing,
        protected CouponService $coupons,
        protected GuestProfileService $guestProfiles,
        protected ResortAccessService $resortAccess,
        protected BranchAccessService $branchAccess,
    ) {}

    public function applyResortScope($query, ?User $user): void
    {
        if (! $user) {
            return;
        }
        if ($user->isGuestAccount()) {
            $query->where('user_id', $user->id);

            return;
        }
        $this->resortAccess->applyResortColumnScope($query, $user, 'resort_id');
        $branchFilter = request()->query('branch_id');
        $this->branchAccess->applyBookingBranchScope(
            $query,
            $user,
            $branchFilter ? (int) $branchFilter : null
        );
    }

    public function assertAccessible(Booking $booking, ?User $user): void
    {
        if (! $user) {
            return;
        }
        if ($user->isGuestAccount()) {
            if ((int) $booking->user_id !== (int) $user->id) {
                abort(403, 'You cannot access this booking.');
            }

            return;
        }
        $this->resortAccess->assertResortAccessible($user, (int) $booking->resort_id);
    }

    public function datesOverlap($existingIn, $existingOut, Carbon $newIn, Carbon $newOut): bool
    {
        $aStart = Carbon::parse($existingIn)->startOfDay();
        $aEnd = Carbon::parse($existingOut)->startOfDay();
        $bStart = $newIn->copy()->startOfDay();
        $bEnd = $newOut->copy()->startOfDay();

        return $aStart->lt($bEnd) && $aEnd->gt($bStart);
    }

    public function busyRoomIds(Carbon $checkIn, Carbon $checkOut, ?int $ignoreBookingId = null): array
    {
        $q = Booking::query()
            ->whereIn('status', Booking::BLOCKING_STATUSES)
            ->whereNotNull('check_in')
            ->whereNotNull('check_out')
            // Same rule as datesOverlap(): existing_in < requested_out AND existing_out > requested_in
            ->whereDate('check_in', '<', $checkOut->toDateString())
            ->whereDate('check_out', '>', $checkIn->toDateString());

        if ($ignoreBookingId) {
            $q->where('id', '!=', $ignoreBookingId);
        }

        $busy = [];
        foreach ($q->with('rooms:id')->get() as $booking) {
            foreach ($booking->rooms as $room) {
                $busy[$room->id] = $room->id;
            }
        }

        return array_values($busy);
    }

    public function overlappingRoomIds(array $roomIds, Carbon $checkIn, Carbon $checkOut, ?int $ignoreBookingId = null): array
    {
        if ($roomIds === []) {
            return [];
        }
        $busy = $this->busyRoomIds($checkIn, $checkOut, $ignoreBookingId);

        return array_values(array_intersect($roomIds, $busy));
    }

    public function assertRoomsAvailable(array $roomIds, Carbon $checkIn, Carbon $checkOut, ?int $ignoreBookingId = null): void
    {
        $rooms = Room::whereIn('id', $roomIds)->get();
        if ($rooms->count() !== count(array_unique($roomIds))) {
            throw ValidationException::withMessages(['room_ids' => ['One or more rooms were not found.']]);
        }
        foreach ($rooms as $room) {
            if ($room->status === 'maintenance') {
                throw ValidationException::withMessages([
                    'room_ids' => ["Room {$room->room_number} is under maintenance."],
                ]);
            }
        }
        $busy = $this->overlappingRoomIds($roomIds, $checkIn, $checkOut, $ignoreBookingId);
        if ($busy !== []) {
            $numbers = Room::whereIn('id', $busy)->pluck('room_number')->implode(', ');
            $message = "Room(s) {$numbers} are not available for the selected dates.";
            throw new RoomUnavailableException(
                $message,
                $this->buildUnavailableRoomsPayload($busy, $checkIn, $checkOut, $ignoreBookingId)
            );
        }
    }

    /**
     * Blocking reservation windows for a room (dates only — safe for guest-facing APIs).
     *
     * @return array<int, array{check_in: string, check_out: string}>
     */
    public function blockingStayWindowsForRoom(int $roomId, ?int $ignoreBookingId = null): array
    {
        $q = Booking::query()
            ->whereIn('status', Booking::BLOCKING_STATUSES)
            ->whereNotNull('check_in')
            ->whereNotNull('check_out')
            ->whereHas('rooms', function ($query) use ($roomId) {
                $query->where('rooms.id', $roomId);
            })
            ->orderBy('check_in');

        if ($ignoreBookingId) {
            $q->where('id', '!=', $ignoreBookingId);
        }

        $windows = [];
        foreach ($q->get(['check_in', 'check_out']) as $booking) {
            $windows[] = [
                'check_in' => Carbon::parse($booking->check_in)->toDateString(),
                'check_out' => Carbon::parse($booking->check_out)->toDateString(),
            ];
        }

        return $windows;
    }

    /**
     * @param  array<int, array{check_in: string, check_out: string}>  $windows
     * @return array<int, array{check_in: string, check_out: string}>
     */
    public function overlappingStayWindows(array $windows, Carbon $requestedIn, Carbon $requestedOut): array
    {
        $conflicts = [];
        foreach ($windows as $window) {
            if ($this->datesOverlap($window['check_in'], $window['check_out'], $requestedIn, $requestedOut)) {
                $conflicts[] = $window;
            }
        }

        return $conflicts;
    }

    /**
     * First check-in date (on or after $requestedCheckIn) where a stay of $stayNights fits.
     *
     * @param  array<int, array{check_in: string, check_out: string}>  $blockingWindows
     */
    public function nextAvailableCheckInForStayLength(
        array $blockingWindows,
        Carbon $requestedCheckIn,
        int $stayNights,
        int $maxIterations = 366,
    ): ?string {
        $stayNights = max(1, $stayNights);
        $candidate = $requestedCheckIn->copy()->startOfDay();

        for ($i = 0; $i < $maxIterations; $i++) {
            $candidateOut = $candidate->copy()->addDays($stayNights);
            $overlapping = $this->overlappingStayWindows($blockingWindows, $candidate, $candidateOut);
            if ($overlapping === []) {
                return $candidate->toDateString();
            }

            $latestCheckout = null;
            foreach ($overlapping as $window) {
                $checkOut = Carbon::parse($window['check_out'])->startOfDay();
                if ($latestCheckout === null || $checkOut->gt($latestCheckout)) {
                    $latestCheckout = $checkOut;
                }
            }

            if ($latestCheckout === null) {
                break;
            }

            if ($latestCheckout->lte($candidate)) {
                $latestCheckout = $latestCheckout->copy()->addDay();
            }
            $candidate = $latestCheckout->copy()->startOfDay();
        }

        return null;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function buildUnavailableRoomsPayload(
        array $roomIds,
        Carbon $checkIn,
        Carbon $checkOut,
        ?int $ignoreBookingId = null,
    ): array {
        $stayNights = max(1, (int) $checkIn->copy()->startOfDay()->diffInDays($checkOut->copy()->startOfDay()));
        $rooms = Room::whereIn('id', $roomIds)->get(['id', 'room_number']);
        $payload = [];

        foreach ($rooms as $room) {
            $windows = $this->blockingStayWindowsForRoom((int) $room->id, $ignoreBookingId);
            $conflicts = $this->overlappingStayWindows($windows, $checkIn, $checkOut);
            $payload[] = [
                'room_id' => (int) $room->id,
                'room_number' => $room->room_number,
                'requested_check_in' => $checkIn->toDateString(),
                'requested_check_out' => $checkOut->toDateString(),
                'requested_nights' => $stayNights,
                'conflicts' => $conflicts,
                'next_available_from' => $this->nextAvailableCheckInForStayLength($windows, $checkIn, $stayNights),
            ];
        }

        return $payload;
    }

    public function createBooking(array $data, ?User $actor = null): Booking
    {
        $data['user_id'] = $data['user_id'] ?? $actor?->id ?? auth()->id();
        $guest = $this->guestProfiles->guestForUser($actor ?? auth()->user());
        if ($guest) {
            $data['guest_id'] = $guest->id;
        }
        $data['booking_code'] = $data['booking_code'] ?? 'BK-'.strtoupper(Str::random(8));
        $data['adults'] = $data['adults'] ?? 1;
        $data['children'] = $data['children'] ?? 0;
        $data['status'] = $data['status'] ?? 'pending';
        $data['created_by'] = $actor?->id ?? auth()->id();
        if ($actor?->isGuestAccount()) {
            $data['source'] = 'website';
            $data['user_id'] = $actor->id;
        } else {
            $data['source'] = $data['source'] ?? 'staff';
        }

        if ($data['status'] !== 'pending') {
            throw ValidationException::withMessages(['status' => ['New bookings must start as pending.']]);
        }

        $checkIn = isset($data['check_in']) ? Carbon::parse($data['check_in']) : now()->startOfDay();
        $checkOut = isset($data['check_out']) ? Carbon::parse($data['check_out']) : $checkIn->copy()->addDay();
        if ($checkOut->lte($checkIn)) {
            throw ValidationException::withMessages(['check_out' => ['Check-out must be after check-in.']]);
        }
        $nights = max(1, (int) $checkIn->copy()->startOfDay()->diffInDays($checkOut->copy()->startOfDay()));

        $data['check_in'] = $checkIn;
        $data['check_out'] = $checkOut;
        $data['nights'] = $nights;

        $roomIds = array_values(array_unique(array_map('intval', $data['room_ids'] ?? [])));
        unset($data['room_ids']);
        if ($roomIds === []) {
            throw ValidationException::withMessages(['room_ids' => ['Select at least one room.']]);
        }

        $roomsForBranch = Room::query()->whereIn('id', $roomIds)->get(['id', 'branch_id', 'resort_id']);
        if (empty($data['branch_id'])) {
            $branchIds = $roomsForBranch->pluck('branch_id')->filter()->unique()->values();
            if ($branchIds->count() === 1) {
                $data['branch_id'] = (int) $branchIds->first();
            }
        }

        $this->assertRoomsAvailable($roomIds, $checkIn, $checkOut);

        // Every money figure below is derived here; anything the caller sent for
        // discount, subtotal or total is discarded.
        $pivot = $this->buildRoomPivot($roomIds, $nights);
        $coupon = $this->resolveCoupon($data, $pivot);
        $totals = $this->pricing->totalsFromSnapshot(
            $pivot,
            ['coupon' => $coupon] + $this->chargeOverrides($data, $actor)
        );

        unset($data['coupon_code']);
        $data['coupon_id'] = $coupon?->id ?? ($data['coupon_id'] ?? null);
        $data['subtotal'] = $totals['subtotal'];
        $data['room_discount_total'] = $totals['room_discount_total'];
        $data['discount'] = $totals['discount'];
        $data['tax_amount'] = $totals['tax'];
        $data['service_charge_amount'] = $totals['service_charge'];
        $data['total_amount'] = $totals['total'];
        $data['deposit_amount'] = 0;
        $data['balance_due'] = $totals['total'];

        return DB::transaction(function () use ($data, $pivot, $coupon) {
            $booking = Booking::create($data);
            $booking->rooms()->attach($pivot);
            $this->logStatus($booking, 'pending', $data['created_by'] ?? auth()->id(), null);

            if ($coupon) {
                $this->coupons->markUsed($coupon);
            }

            return $booking->fresh();
        });
    }

    public function updateBooking(Booking $booking, array $data, ?User $actor = null): Booking
    {
        if (isset($data['status'])) {
            return $this->transitionStatus($booking, $data['status'], $actor, $data['cancellation_reason'] ?? null);
        }

        $roomIds = array_key_exists('room_ids', $data) ? $data['room_ids'] : null;
        unset($data['room_ids'], $data['total_amount'], $data['subtotal'], $data['discount'], $data['room_discount_total']);

        if (! in_array($booking->status, ['pending', 'confirmed'], true) && $roomIds !== null) {
            throw ValidationException::withMessages(['room_ids' => ['Rooms can only be changed before check-in.']]);
        }

        $checkIn = isset($data['check_in']) ? Carbon::parse($data['check_in']) : $booking->check_in;
        $checkOut = isset($data['check_out']) ? Carbon::parse($data['check_out']) : $booking->check_out;
        if ($checkOut->lte($checkIn)) {
            throw ValidationException::withMessages(['check_out' => ['Check-out must be after check-in.']]);
        }

        $ids = $roomIds !== null ? array_values(array_unique(array_map('intval', $roomIds))) : $booking->rooms()->pluck('rooms.id')->all();
        $this->assertRoomsAvailable($ids, $checkIn, $checkOut, $booking->id);

        $nights = max(1, (int) $checkIn->copy()->startOfDay()->diffInDays($checkOut->copy()->startOfDay()));

        // Rooms already on the booking keep their agreed rate and percentage, so a
        // later change to the room or room type discount never moves this total.
        $pivot = $this->buildRoomPivotForUpdate($ids, $nights, $booking);

        $coupon = array_key_exists('coupon_code', $data) || array_key_exists('coupon_id', $data)
            ? $this->resolveCoupon($data, $pivot)
            : ($booking->coupon_id ? Coupon::find($booking->coupon_id) : null);

        $totals = $this->pricing->totalsFromSnapshot(
            $pivot,
            ['coupon' => $coupon] + $this->chargeOverrides($data, $actor)
        );
        $paid = (float) $booking->payments()->where('status', 'paid')->sum('paid_amount');

        $booking->fill([
            'user_id' => $data['user_id'] ?? $booking->user_id,
            'resort_id' => $data['resort_id'] ?? $booking->resort_id,
            'coupon_id' => $coupon?->id,
            'adults' => $data['adults'] ?? $booking->adults,
            'children' => $data['children'] ?? $booking->children,
            'special_requests' => array_key_exists('special_requests', $data) ? $data['special_requests'] : $booking->special_requests,
            'check_in' => $checkIn,
            'check_out' => $checkOut,
            'nights' => $nights,
            'discount' => $totals['discount'],
            'room_discount_total' => $totals['room_discount_total'],
            'tax_amount' => $totals['tax'],
            'service_charge_amount' => $totals['service_charge'],
            'subtotal' => $totals['subtotal'],
            'total_amount' => $totals['total'],
            'balance_due' => max(0, $totals['total'] - $paid),
        ]);
        $booking->save();
        $booking->rooms()->sync($pivot);

        return $booking->fresh();
    }

    public function transitionStatus(Booking $booking, string $to, ?User $actor = null, ?string $reason = null): Booking
    {
        $from = $booking->status;
        if ($to === 'checked_out') {
            $to = 'completed';
        }
        $allowed = Booking::TRANSITIONS[$from] ?? [];
        if (! in_array($to, $allowed, true)) {
            throw ValidationException::withMessages([
                'status' => ["Cannot change booking from {$from} to {$to}."],
            ]);
        }

        return DB::transaction(function () use ($booking, $from, $to, $actor, $reason) {
            $now = now();
            $patch = ['status' => $to];

            if ($to === 'confirmed') {
                $patch['confirmed_at'] = $now;
            }

            if ($to === 'checked_in') {
                $patch['confirmed_at'] = $booking->confirmed_at ?? $now;
                $patch['checked_in_at'] = $now;
                $this->setRoomsStatus($booking, 'occupied');
            }

            if ($to === 'completed') {
                $booking->loadMissing('payments');
                $this->syncBalance($booking);
                $booking->refresh();
                if ((float) $booking->balance_due > 0.009) {
                    throw ValidationException::withMessages([
                        'status' => ['Cannot complete checkout while a balance is due. Collect payment first.'],
                    ]);
                }
                if (! in_array($from, ['checked_in', 'checked_out'], true)) {
                    throw ValidationException::withMessages([
                        'status' => ['Only in-house guests can complete checkout.'],
                    ]);
                }
                $patch['checked_out_at'] = $booking->checked_out_at ?? $now;
                $patch['completed_at'] = $now;
                $this->releaseRooms($booking);
            }

            if ($to === 'cancelled') {
                $patch['cancelled_at'] = $now;
                $patch['cancelled_by'] = $actor?->id;
                $patch['cancellation_reason'] = $reason;
                $this->releaseRooms($booking);
            }

            $booking->update($patch);
            $this->logStatus($booking, $to, $actor?->id ?? auth()->id(), $from, $reason);

            return $booking->fresh();
        });
    }

    public function deleteBooking(Booking $booking): void
    {
        if (in_array($booking->status, ['checked_in', 'completed'], true)) {
            throw ValidationException::withMessages([
                'status' => ['In-house or completed bookings cannot be deleted. Cancel or keep them for records.'],
            ]);
        }
        $this->releaseRooms($booking);
        $booking->delete();
    }

    protected function setRoomsStatus(Booking $booking, string $status): void
    {
        $booking->loadMissing('rooms');
        foreach ($booking->rooms as $room) {
            if ($room->status === 'maintenance') {
                continue;
            }
            $room->update(['status' => $status]);
        }
    }

    protected function releaseRooms(Booking $booking): void
    {
        $booking->loadMissing('rooms');
        foreach ($booking->rooms as $room) {
            if ($room->status === 'maintenance') {
                continue;
            }
            $today = now()->startOfDay();
            $tomorrow = $today->copy()->addDay();
            $stillBlocking = false;
            foreach (
                $room->bookings()
                    ->whereIn('bookings.status', Booking::BLOCKING_STATUSES)
                    ->where('bookings.id', '!=', $booking->id)
                    ->get(['bookings.id', 'check_in', 'check_out']) as $other
            ) {
                if ($this->datesOverlap($other->check_in, $other->check_out, $today, $tomorrow)) {
                    $stillBlocking = true;
                    break;
                }
            }
            if (! $stillBlocking) {
                $room->update(['status' => 'available']);
            }
        }
    }

    /** Price rooms at current catalogue rates, including their percentage discount. */
    protected function buildRoomPivot(array $roomIds, int $nights): array
    {
        $rooms = Room::with('roomType')->whereIn('id', $roomIds)->get()->keyBy('id');

        $pivot = [];
        foreach ($roomIds as $roomId) {
            $room = $rooms->get($roomId);
            if (! $room) {
                continue;
            }
            $pivot[$roomId] = $this->pricing->snapshotLine(
                $room->price_per_night,
                $this->pricing->resolveDiscountPercent($room),
                $nights
            );
        }

        return $pivot;
    }

    /**
     * Re-spread an existing booking over a (possibly new) night count while
     * honouring the rate and percentage that were agreed when it was created.
     * Only rooms newly added to the booking are priced at today's rates.
     */
    protected function buildRoomPivotForUpdate(array $roomIds, int $nights, Booking $booking): array
    {
        $existing = $booking->rooms()->get()->keyBy('id');
        $newIds = array_values(array_diff($roomIds, $existing->keys()->all()));
        $pivot = $newIds === [] ? [] : $this->buildRoomPivot($newIds, $nights);

        foreach ($roomIds as $roomId) {
            $prior = $existing->get($roomId);
            if (! $prior) {
                continue;
            }
            $pivot[$roomId] = $this->pricing->snapshotLine(
                $prior->pivot->price_per_night,
                $prior->pivot->discount_percent,
                $nights
            );
        }

        return $pivot;
    }

    /** Validate a coupon against the discounted room subtotal. */
    protected function resolveCoupon(array $data, array $pivot): ?Coupon
    {
        $netCents = 0;
        foreach ($pivot as $row) {
            $netCents += (int) round(((float) ($row['net_subtotal'] ?? 0)) * 100);
        }

        if (! empty($data['coupon_code'])) {
            return $this->coupons->resolve($data['coupon_code'], $netCents);
        }

        if (! empty($data['coupon_id'])) {
            $coupon = Coupon::find($data['coupon_id']);
            if ($coupon) {
                $this->coupons->assertUsable($coupon, $netCents);
            }

            return $coupon;
        }

        return null;
    }

    /**
     * Only staff may override tax or service charge; guest-supplied zeros are ignored.
     *
     * @return array{tax_amount?: mixed, service_charge_amount?: mixed}
     */
    protected function chargeOverrides(array $data, ?User $actor = null): array
    {
        $user = $actor ?? auth()->user();
        if (! $user?->isAdmin()) {
            return [];
        }

        $overrides = [];
        if (array_key_exists('tax_amount', $data) && $data['tax_amount'] !== null) {
            $overrides['tax_amount'] = $data['tax_amount'];
        }
        if (array_key_exists('service_charge_amount', $data) && $data['service_charge_amount'] !== null) {
            $overrides['service_charge_amount'] = $data['service_charge_amount'];
        }

        return $overrides;
    }

    protected function syncBalance(Booking $booking): void
    {
        $paid = (float) $booking->payments()->where('status', 'paid')->sum('paid_amount');
        $refunded = (float) $booking->payments()->where('status', 'refunded')->sum('refund_amount');
        $net = max(0, $paid - $refunded);
        $booking->forceFill([
            'deposit_amount' => $net,
            'balance_due' => max(0, (float) $booking->total_amount - $net),
        ])->save();
    }

    protected function logStatus(Booking $booking, string $newStatus, ?int $userId, ?string $oldStatus = null, ?string $note = null): void
    {
        BookingStatusLog::create([
            'booking_id' => $booking->id,
            'old_status' => $oldStatus,
            'new_status' => $newStatus,
            'changed_by' => $userId,
            'note' => $note,
        ]);
    }
}
