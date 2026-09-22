<?php

namespace App\Services;

use App\Models\Coupon;
use Illuminate\Validation\ValidationException;

/**
 * Coupons stack *after* the room percentage discount.
 *
 * The coupon always applies to the already-discounted subtotal, so a stay can
 * never have the same money taken off twice, and min_order is measured against
 * what the guest would actually pay for the rooms rather than the list price.
 */
class CouponService
{
    public function find(?string $code): ?Coupon
    {
        $code = strtoupper(trim((string) $code));

        if ($code === '') {
            return null;
        }

        return Coupon::whereRaw('UPPER(code) = ?', [$code])->first();
    }

    /**
     * Look up and validate a coupon against a discounted subtotal in cents.
     * Returns null when no code was supplied.
     */
    public function resolve(?string $code, int $netCents): ?Coupon
    {
        $code = trim((string) $code);

        if ($code === '') {
            return null;
        }

        $coupon = $this->find($code);

        if (! $coupon) {
            throw ValidationException::withMessages(['coupon_code' => ['This promo code is not recognised.']]);
        }

        $this->assertUsable($coupon, $netCents);

        return $coupon;
    }

    public function assertUsable(Coupon $coupon, int $netCents): void
    {
        if ($coupon->status !== 'active') {
            throw ValidationException::withMessages(['coupon_code' => ['This promo code is no longer active.']]);
        }

        if ($coupon->expires_at && $coupon->expires_at->endOfDay()->isPast()) {
            throw ValidationException::withMessages(['coupon_code' => ['This promo code has expired.']]);
        }

        if ($coupon->usage_limit !== null && (int) $coupon->used_count >= (int) $coupon->usage_limit) {
            throw ValidationException::withMessages(['coupon_code' => ['This promo code has reached its usage limit.']]);
        }

        $minOrderCents = (int) round(((float) $coupon->min_order) * 100);
        if ($minOrderCents > 0 && $netCents < $minOrderCents) {
            $required = number_format($minOrderCents / 100, 2);
            throw ValidationException::withMessages([
                'coupon_code' => ["This promo code requires a room subtotal of at least {$required}."],
            ]);
        }
    }

    /**
     * Discount in cents, capped at the discounted subtotal so a coupon can never
     * push a booking negative.
     */
    public function discountCentsFor(Coupon $coupon, int $netCents): int
    {
        if ($netCents <= 0) {
            return 0;
        }

        $value = (float) $coupon->value;

        if ($value <= 0) {
            return 0;
        }

        $cents = $coupon->type === 'percent'
            ? (int) round(($netCents * min(100, $value)) / 100)
            : (int) round($value * 100);

        return max(0, min($netCents, $cents));
    }

    public function markUsed(Coupon $coupon): void
    {
        $coupon->increment('used_count');
    }
}
