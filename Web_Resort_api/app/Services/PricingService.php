<?php

namespace App\Services;

use App\Models\Room;
use App\Models\RoomType;
use Illuminate\Support\Collection;

/**
 * Single source of truth for booking money.
 *
 * Every figure the guest or dashboard ever sees is produced here. All arithmetic
 * runs in integer cents so float representation never decides a price.
 */
class PricingService
{
    /** Shared validation rules so every write path bounds the percentage identically. */
    public const DISCOUNT_RULES = ['numeric', 'min:0', 'max:100'];

    /**
     * Resolve the percentage that applies to a physical room.
     *
     * A room-level value wins; NULL means inherit the room type campaign.
     */
    public function resolveDiscountPercent(Room $room): float
    {
        $own = $room->discount_percent;

        if ($own !== null && $own !== '') {
            return $this->clampPercent((float) $own);
        }

        $room->loadMissing('roomType');

        return $this->clampPercent((float) ($room->roomType->discount_percent ?? 0));
    }

    public function resolveRoomTypeDiscountPercent(RoomType $type): float
    {
        return $this->clampPercent((float) ($type->discount_percent ?? 0));
    }

    /**
     * Price a stay from an agreed rate and percentage, in the shape the
     * booking_rooms pivot stores. Used both for fresh quotes and for re-spreading
     * an existing booking over a new night count without re-reading live rates.
     */
    public function snapshotLine(mixed $pricePerNight, mixed $discountPercent, int $nights): array
    {
        $nights = max(1, $nights);
        $percent = $this->clampPercent((float) $discountPercent);

        $priceCents = $this->toCents($pricePerNight);
        $grossCents = $priceCents * $nights;
        $discountCents = $this->percentOf($grossCents, $percent);

        return [
            'price_per_night' => $this->toMoney($priceCents),
            'nights' => $nights,
            'discount_percent' => $percent,
            'discount_amount' => $this->toMoney($discountCents),
            'subtotal' => $this->toMoney($grossCents),
            'net_subtotal' => $this->toMoney($grossCents - $discountCents),
        ];
    }

    /**
     * Price one room for a stay at current catalogue rates, with display extras.
     */
    public function roomLine(Room $room, int $nights): array
    {
        $percent = $this->resolveDiscountPercent($room);
        $line = $this->snapshotLine($room->price_per_night, $percent, $nights);
        $priceCents = $this->toCents($room->price_per_night);

        return $line + [
            'room_id' => (int) $room->id,
            'room_number' => $room->room_number,
            'room_type_id' => (int) $room->room_type_id,
            'room_type' => $room->roomType?->name,
            'gross_subtotal' => $line['subtotal'],
            'discounted_price_per_night' => $this->toMoney($priceCents - $this->percentOf($priceCents, $percent)),
        ];
    }

    /**
     * Price a whole stay: per-room lines plus the authoritative booking totals.
     *
     * Each room's discount is calculated independently, then summed. The coupon
     * (when any) applies to the already-discounted subtotal, never to gross, so
     * a discount can never be taken twice.
     *
     * @param  Collection<int, Room>  $rooms
     */
    public function quoteStay(Collection $rooms, int $nights, array $options = []): array
    {
        $lines = $rooms->map(fn (Room $room) => $this->roomLine($room, $nights))->values()->all();

        $grossCents = 0;
        $roomDiscountCents = 0;
        foreach ($lines as $line) {
            $grossCents += $this->toCents($line['gross_subtotal']);
            $roomDiscountCents += $this->toCents($line['discount_amount']);
        }
        $netCents = $grossCents - $roomDiscountCents;

        $coupon = $options['coupon'] ?? null;
        $couponDiscountCents = 0;
        if ($coupon) {
            $couponDiscountCents = app(CouponService::class)->discountCentsFor($coupon, $netCents);
        }

        $baseCents = max(0, $netCents - $couponDiscountCents);

        // Staff may override tax/service explicitly; guests never can.
        $taxCents = array_key_exists('tax_amount', $options) && $options['tax_amount'] !== null
            ? $this->toCents($options['tax_amount'])
            : $this->percentOf($baseCents, $this->taxRate() * 100);

        $serviceCents = array_key_exists('service_charge_amount', $options) && $options['service_charge_amount'] !== null
            ? $this->toCents($options['service_charge_amount'])
            : $this->percentOf($baseCents, $this->serviceChargeRate() * 100);

        $discountCents = $roomDiscountCents + $couponDiscountCents;

        return [
            'rooms' => $lines,
            'nights' => max(1, $nights),
            'subtotal' => $this->toMoney($grossCents),
            'room_discount_total' => $this->toMoney($roomDiscountCents),
            'coupon_discount' => $this->toMoney($couponDiscountCents),
            'coupon_code' => $coupon?->code,
            'discount' => $this->toMoney($discountCents),
            'discounted_subtotal' => $this->toMoney($netCents),
            'tax' => $this->toMoney($taxCents),
            'service_charge' => $this->toMoney($serviceCents),
            'total' => $this->toMoney($baseCents + $taxCents + $serviceCents),
        ];
    }

    /**
     * Totals for a set of already-snapshotted pivot rows, so updating a booking
     * never re-prices rooms that were quoted earlier.
     */
    public function totalsFromSnapshot(array $pivot, array $options = []): array
    {
        $grossCents = 0;
        $roomDiscountCents = 0;
        foreach ($pivot as $row) {
            $grossCents += $this->toCents($row['subtotal'] ?? 0);
            $roomDiscountCents += $this->toCents($row['discount_amount'] ?? 0);
        }
        $netCents = $grossCents - $roomDiscountCents;

        $coupon = $options['coupon'] ?? null;
        $couponDiscountCents = $coupon
            ? app(CouponService::class)->discountCentsFor($coupon, $netCents)
            : $this->toCents($options['coupon_discount'] ?? 0);

        $baseCents = max(0, $netCents - $couponDiscountCents);

        $taxCents = array_key_exists('tax_amount', $options) && $options['tax_amount'] !== null
            ? $this->toCents($options['tax_amount'])
            : $this->percentOf($baseCents, $this->taxRate() * 100);

        $serviceCents = array_key_exists('service_charge_amount', $options) && $options['service_charge_amount'] !== null
            ? $this->toCents($options['service_charge_amount'])
            : $this->percentOf($baseCents, $this->serviceChargeRate() * 100);

        return [
            'subtotal' => $this->toMoney($grossCents),
            'room_discount_total' => $this->toMoney($roomDiscountCents),
            'coupon_discount' => $this->toMoney($couponDiscountCents),
            'discount' => $this->toMoney($roomDiscountCents + $couponDiscountCents),
            'discounted_subtotal' => $this->toMoney($netCents),
            'tax' => $this->toMoney($taxCents),
            'service_charge' => $this->toMoney($serviceCents),
            'total' => $this->toMoney($baseCents + $taxCents + $serviceCents),
        ];
    }

    /** Price a sellable room type for catalogue display. */
    public function roomTypePricing(RoomType $type): array
    {
        $percent = $this->resolveRoomTypeDiscountPercent($type);
        $baseCents = $this->toCents($type->base_price);

        return [
            'discount_percent' => $percent,
            'original_price' => $this->toMoney($baseCents),
            'discounted_price' => $this->toMoney($baseCents - $this->percentOf($baseCents, $percent)),
        ];
    }

    public function taxRate(): float
    {
        return (float) config('pricing.tax_rate', 0.10);
    }

    public function serviceChargeRate(): float
    {
        return (float) config('pricing.service_charge_rate', 0.10);
    }

    public function clampPercent(float $percent): float
    {
        $max = (float) config('pricing.max_discount_percent', 100);

        return round(max(0.0, min($max, $percent)), 2);
    }

    /** Percentage of an integer-cent amount, rounded half-up to the cent. */
    protected function percentOf(int $cents, float $percent): int
    {
        if ($cents <= 0 || $percent <= 0) {
            return 0;
        }

        return (int) round(($cents * $percent) / 100);
    }

    protected function toCents(mixed $value): int
    {
        return (int) round(((float) $value) * 100);
    }

    protected function toMoney(int $cents): float
    {
        return round($cents / 100, 2);
    }
}
