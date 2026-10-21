<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\Booking;
use App\Models\BookingDateChange;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class BookingRescheduleService
{
    public function __construct(
        protected BookingService $bookings,
        protected PricingService $pricing,
    ) {}

    public function assertGuestEligible(Booking $booking, User $user): void
    {
        if (! config('booking.reschedule.enabled', true)) {
            throw ValidationException::withMessages(['reschedule' => ['Date changes are not available right now.']]);
        }

        $this->bookings->assertAccessible($booking, $user);

        if (! $user->isGuestAccount() || (int) $booking->user_id !== (int) $user->id) {
            throw ValidationException::withMessages(['booking' => ['You cannot modify this reservation.']]);
        }

        $eligible = config('booking.reschedule.eligible_statuses', ['pending', 'confirmed']);
        if (! in_array($booking->status, $eligible, true)) {
            throw ValidationException::withMessages([
                'status' => ['This reservation cannot be rescheduled in its current state.'],
            ]);
        }

        if ($booking->checked_in_at) {
            throw ValidationException::withMessages(['status' => ['Checked-in reservations cannot be rescheduled online.']]);
        }

        $minDays = (int) config('booking.reschedule.min_days_before_check_in', 0);
        if ($minDays > 0 && $booking->check_in) {
            $cutoff = Carbon::parse($booking->check_in)->startOfDay()->subDays($minDays);
            if (now()->startOfDay()->gt($cutoff)) {
                throw ValidationException::withMessages([
                    'check_in' => ["Rescheduling must be requested at least {$minDays} day(s) before arrival."],
                ]);
            }
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function quote(Booking $booking, User $user, string $checkIn, string $checkOut): array
    {
        $this->assertGuestEligible($booking, $user);

        [$newIn, $newOut, $nights] = $this->parseStay($checkIn, $checkOut);
        $roomIds = $booking->rooms()->pluck('rooms.id')->map(fn ($id) => (int) $id)->all();

        $this->bookings->assertRoomsAvailable($roomIds, $newIn, $newOut, $booking->id);

        $pivot = $this->bookings->roomPivotForDateChange($roomIds, $nights, $booking);
        $coupon = $booking->coupon_id ? \App\Models\Coupon::find($booking->coupon_id) : null;
        $totals = $this->pricing->totalsFromSnapshot($pivot, ['coupon' => $coupon]);

        $paid = (float) $booking->payments()->where('status', 'paid')->sum('paid_amount');
        $previousTotal = (float) $booking->total_amount;
        $newTotal = (float) $totals['total'];
        $difference = round($newTotal - $previousTotal, 2);
        $newBalance = max(0, round($newTotal - $paid, 2));

        return [
            'booking_id' => $booking->id,
            'previous' => [
                'check_in' => Carbon::parse($booking->check_in)->toDateString(),
                'check_out' => Carbon::parse($booking->check_out)->toDateString(),
                'nights' => (int) $booking->nights,
                'total' => $previousTotal,
                'balance_due' => (float) $booking->balance_due,
            ],
            'proposed' => [
                'check_in' => $newIn->toDateString(),
                'check_out' => $newOut->toDateString(),
                'nights' => $nights,
                'subtotal' => (float) $totals['subtotal'],
                'discount' => (float) $totals['discount'],
                'tax' => (float) $totals['tax'],
                'service_charge' => (float) $totals['service_charge'],
                'total' => $newTotal,
                'balance_due' => $newBalance,
            ],
            'price_difference' => $difference,
            'requires_additional_payment' => $newBalance > (float) $booking->balance_due + 0.009,
            'additional_payment_amount' => max(0, round($newBalance - (float) $booking->balance_due, 2)),
            'credit_applied_to_balance' => $difference < 0,
            'refund_note' => $difference < 0
                ? 'A lower total reduces your balance due. Automatic refunds are not issued; contact the resort if you paid in advance.'
                : null,
            'currency' => 'USD',
            'room_ids' => $roomIds,
        ];
    }

    public function apply(Booking $booking, User $user, string $checkIn, string $checkOut, ?string $reason = null): array
    {
        $preview = $this->quote($booking, $user, $checkIn, $checkOut);

        if (
            $preview['previous']['check_in'] === $preview['proposed']['check_in']
            && $preview['previous']['check_out'] === $preview['proposed']['check_out']
        ) {
            throw ValidationException::withMessages(['dates' => ['Choose different dates to reschedule.']]);
        }

        return DB::transaction(function () use ($booking, $user, $checkIn, $checkOut, $reason, $preview) {
            $locked = Booking::query()->whereKey($booking->id)->lockForUpdate()->firstOrFail();
            $this->assertGuestEligible($locked, $user);

            $oldIn = Carbon::parse($locked->check_in)->toDateString();
            $oldOut = Carbon::parse($locked->check_out)->toDateString();
            $oldTotal = (float) $locked->total_amount;

            $updated = $this->bookings->updateBooking($locked, [
                'check_in' => $checkIn,
                'check_out' => $checkOut,
            ], $user);

            BookingDateChange::create([
                'booking_id' => $updated->id,
                'changed_by' => $user->id,
                'previous_check_in' => $oldIn,
                'previous_check_out' => $oldOut,
                'new_check_in' => $preview['proposed']['check_in'],
                'new_check_out' => $preview['proposed']['check_out'],
                'previous_total' => $oldTotal,
                'new_total' => $preview['proposed']['total'],
                'price_difference' => $preview['price_difference'],
                'currency' => $preview['currency'],
                'reason' => $reason,
                'source' => 'guest',
            ]);

            ActivityLog::create([
                'user_id' => $user->id,
                'action' => 'booking.rescheduled',
                'model_type' => Booking::class,
                'model_id' => $updated->id,
                'description' => 'Guest rescheduled stay dates',
                'changes' => [
                    'from' => ['check_in' => $oldIn, 'check_out' => $oldOut, 'total' => $oldTotal],
                    'to' => $preview['proposed'],
                ],
                'ip_address' => request()?->ip() ?? '',
                'user_agent' => request()?->userAgent() ?? '',
            ]);

            return [
                'booking' => $updated->fresh(['rooms.roomType', 'resort', 'branch', 'dateChanges']),
                'summary' => $preview,
                'payment_required' => $preview['requires_additional_payment'],
                'payment_url_hint' => $preview['requires_additional_payment']
                    ? '/payment?bookingId='.$updated->id
                    : null,
            ];
        });
    }

    /**
     * @return array{0: Carbon, 1: Carbon, 2: int}
     */
    protected function parseStay(string $checkIn, string $checkOut): array
    {
        $newIn = Carbon::parse($checkIn)->startOfDay();
        $newOut = Carbon::parse($checkOut)->startOfDay();
        if ($newOut->lte($newIn)) {
            throw ValidationException::withMessages(['check_out' => ['Check-out must be after check-in.']]);
        }
        $nights = max(1, (int) $newIn->diffInDays($newOut));

        return [$newIn, $newOut, $nights];
    }
}
