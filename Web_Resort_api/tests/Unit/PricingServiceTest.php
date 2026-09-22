<?php

namespace Tests\Unit;

use App\Models\Coupon;
use App\Models\Resort;
use App\Models\Room;
use App\Models\RoomType;
use App\Services\PricingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class PricingServiceTest extends TestCase
{
    use RefreshDatabase;

    protected PricingService $pricing;

    protected Resort $resort;

    protected function setUp(): void
    {
        parent::setUp();

        Config::set('pricing.tax_rate', 0.10);
        Config::set('pricing.service_charge_rate', 0.10);

        $this->pricing = app(PricingService::class);
        $this->resort = Resort::create([
            'name' => 'Solara', 'slug' => 'solara',
            'address' => 'Coastal Road', 'city' => 'Sihanoukville',
        ]);
    }

    protected function makeRoom(float $price, ?float $roomPct, float $typePct = 0, string $number = 'A-101'): Room
    {
        $type = RoomType::create([
            'resort_id' => $this->resort->id,
            'name' => 'Type '.$number,
            'base_price' => $price,
            'discount_percent' => $typePct,
            'max_occupancy' => 4,
        ]);

        return Room::create([
            'resort_id' => $this->resort->id,
            'room_type_id' => $type->id,
            'room_number' => $number,
            'price_per_night' => $price,
            'discount_percent' => $roomPct,
            'status' => 'available',
        ]);
    }

    /** The worked example from the specification. */
    public function test_fifteen_percent_of_three_nights_at_one_hundred(): void
    {
        $line = $this->pricing->roomLine($this->makeRoom(100, 15), 3);

        $this->assertSame(300.0, $line['gross_subtotal']);
        $this->assertSame(15.0, $line['discount_percent']);
        $this->assertSame(45.0, $line['discount_amount']);
        $this->assertSame(255.0, $line['net_subtotal']);
        $this->assertSame(85.0, $line['discounted_price_per_night']);
    }

    public function test_zero_percent_leaves_price_untouched(): void
    {
        $line = $this->pricing->roomLine($this->makeRoom(100, 0), 3);

        $this->assertSame(0.0, $line['discount_amount']);
        $this->assertSame(300.0, $line['net_subtotal']);
    }

    public function test_ten_percent(): void
    {
        $line = $this->pricing->roomLine($this->makeRoom(100, 10), 2);

        $this->assertSame(20.0, $line['discount_amount']);
        $this->assertSame(180.0, $line['net_subtotal']);
    }

    public function test_decimal_percentage_rounds_to_the_cent(): void
    {
        // 12.5% of $333.33 x 1 night = 41.666... -> 41.67
        $line = $this->pricing->roomLine($this->makeRoom(333.33, 12.5), 1);

        $this->assertSame(41.67, $line['discount_amount']);
        $this->assertSame(291.66, $line['net_subtotal']);
    }

    public function test_one_hundred_percent_makes_rooms_free_but_never_negative(): void
    {
        $line = $this->pricing->roomLine($this->makeRoom(100, 100), 3);

        $this->assertSame(300.0, $line['discount_amount']);
        $this->assertSame(0.0, $line['net_subtotal']);
        $this->assertSame(0.0, $line['discounted_price_per_night']);
    }

    public function test_room_null_percentage_inherits_the_room_type(): void
    {
        $room = $this->makeRoom(200, null, 25);

        $this->assertSame(25.0, $this->pricing->resolveDiscountPercent($room));
    }

    public function test_room_percentage_overrides_the_room_type(): void
    {
        $room = $this->makeRoom(200, 5, 25);

        $this->assertSame(5.0, $this->pricing->resolveDiscountPercent($room));
    }

    public function test_room_zero_is_a_real_override_not_an_inherit(): void
    {
        $room = $this->makeRoom(200, 0, 25);

        $this->assertSame(0.0, $this->pricing->resolveDiscountPercent($room));
    }

    public function test_out_of_range_percentages_are_clamped(): void
    {
        $this->assertSame(100.0, $this->pricing->clampPercent(150));
        $this->assertSame(0.0, $this->pricing->clampPercent(-10));
    }

    public function test_multiple_rooms_are_discounted_independently_then_summed(): void
    {
        $rooms = collect([
            $this->makeRoom(100, 15, 0, 'A-1'),   // 300 gross, 45 off
            $this->makeRoom(200, 10, 0, 'A-2'),   // 600 gross, 60 off
            $this->makeRoom(50, 0, 0, 'A-3'),     // 150 gross, 0 off
        ]);

        $quote = $this->pricing->quoteStay($rooms, 3);

        $this->assertSame(1050.0, $quote['subtotal']);
        $this->assertSame(105.0, $quote['room_discount_total']);
        $this->assertSame(945.0, $quote['discounted_subtotal']);
        $this->assertSame(94.5, $quote['tax']);
        $this->assertSame(94.5, $quote['service_charge']);
        $this->assertSame(1134.0, $quote['total']);
    }

    public function test_tax_and_service_apply_to_the_discounted_subtotal(): void
    {
        $quote = $this->pricing->quoteStay(collect([$this->makeRoom(100, 15)]), 3);

        // 10% of 255, not of 300.
        $this->assertSame(255.0, $quote['discounted_subtotal']);
        $this->assertSame(25.5, $quote['tax']);
        $this->assertSame(25.5, $quote['service_charge']);
        $this->assertSame(306.0, $quote['total']);
    }

    public function test_coupon_stacks_on_the_discounted_subtotal_never_the_gross(): void
    {
        $coupon = Coupon::create([
            'code' => 'SOLARA10', 'type' => 'percent', 'value' => 10,
            'min_order' => 0, 'status' => 'active',
        ]);

        $quote = $this->pricing->quoteStay(collect([$this->makeRoom(100, 15)]), 3, ['coupon' => $coupon]);

        // 10% of the discounted 255 = 25.50, not 10% of the gross 300.
        $this->assertSame(300.0, $quote['subtotal']);
        $this->assertSame(45.0, $quote['room_discount_total']);
        $this->assertSame(25.5, $quote['coupon_discount']);
        $this->assertSame(70.5, $quote['discount']);
        $this->assertSame(229.5, $quote['discounted_subtotal'] - $quote['coupon_discount']);
        $this->assertSame(275.4, $quote['total']); // 229.50 + 22.95 + 22.95
    }

    public function test_fixed_coupon_cannot_push_a_booking_negative(): void
    {
        $coupon = Coupon::create([
            'code' => 'BIG', 'type' => 'fixed', 'value' => 9999,
            'min_order' => 0, 'status' => 'active',
        ]);

        $quote = $this->pricing->quoteStay(collect([$this->makeRoom(100, 15)]), 3, ['coupon' => $coupon]);

        $this->assertSame(255.0, $quote['coupon_discount']);
        $this->assertSame(0.0, $quote['total']);
    }

    public function test_totals_from_snapshot_ignores_live_catalogue_rates(): void
    {
        $pivot = [
            1 => ['subtotal' => 300.0, 'discount_amount' => 45.0, 'net_subtotal' => 255.0],
        ];

        $totals = $this->pricing->totalsFromSnapshot($pivot);

        $this->assertSame(300.0, $totals['subtotal']);
        $this->assertSame(45.0, $totals['room_discount_total']);
        $this->assertSame(306.0, $totals['total']);
    }
}
