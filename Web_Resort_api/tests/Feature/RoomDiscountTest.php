<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Coupon;
use App\Models\Resort;
use App\Models\Role;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Covers the full chain: Dashboard write -> Database -> Quote -> Booking ->
 * Payment -> Invoice, plus the tampering paths that must be rejected.
 */
class RoomDiscountTest extends TestCase
{
    use RefreshDatabase;

    protected Resort $resort;

    protected User $guest;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        Config::set('pricing.tax_rate', 0.10);
        Config::set('pricing.service_charge_rate', 0.10);

        $this->resort = Resort::create([
            'name' => 'Solara', 'slug' => 'solara',
            'address' => 'Coastal Road', 'city' => 'Sihanoukville',
        ]);

        $this->guest = User::create([
            'name' => 'Guest', 'email' => 'guest@example.com', 'password' => bcrypt('secret'),
        ]);

        $this->admin = User::create([
            'name' => 'Admin', 'email' => 'admin@example.com', 'password' => bcrypt('secret'),
        ]);
        $adminRole = Role::create(['name' => 'admin', 'display_name' => 'Admin']);
        $this->admin->roles()->attach($adminRole->id);
    }

    protected function makeRoom(float $price, ?float $roomPct = null, float $typePct = 0, string $number = 'A-101'): Room
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

    protected function quote(array $overrides = []): \Illuminate\Testing\TestResponse
    {
        return $this->postJson('/api/customer/booking/quote', array_merge([
            'check_in' => '2027-03-01',
            'check_out' => '2027-03-04',
            'adults' => 2,
        ], $overrides));
    }

    // ── Quote ────────────────────────────────────────────────────────────────

    public function test_quote_returns_the_authoritative_discounted_total(): void
    {
        $room = $this->makeRoom(100, 15);

        $data = $this->quote(['room_ids' => [$room->id]])
            ->assertOk()
            ->json('data');

        $this->assertSame(3, $data['nights']);
        $this->assertSame(300.0, (float) $data['subtotal']);
        $this->assertSame(45.0, (float) $data['room_discount_total']);
        $this->assertSame(255.0, (float) $data['discounted_subtotal']);
        $this->assertSame(25.5, (float) $data['tax']);
        $this->assertSame(25.5, (float) $data['service_charge']);
        $this->assertSame(306.0, (float) $data['total']);

        $line = $data['rooms'][0];
        $this->assertSame(100.0, (float) $line['price_per_night']);
        $this->assertSame(15.0, (float) $line['discount_percent']);
        $this->assertSame(45.0, (float) $line['discount_amount']);
        $this->assertSame(255.0, (float) $line['net_subtotal']);
        $this->assertSame(85.0, (float) $line['discounted_price_per_night']);
    }

    public function test_quote_prices_each_room_independently(): void
    {
        $a = $this->makeRoom(100, 15, 0, 'A-1');
        $b = $this->makeRoom(200, 10, 0, 'A-2');

        $data = $this->quote(['room_ids' => [$a->id, $b->id]])->assertOk()->json('data');

        $this->assertSame(900.0, (float) $data['subtotal']);          // 300 + 600
        $this->assertSame(105.0, (float) $data['room_discount_total']); // 45 + 60
        $this->assertSame(795.0, (float) $data['discounted_subtotal']);
        $this->assertSame(954.0, (float) $data['total']);
    }

    public function test_quote_inherits_the_room_type_discount(): void
    {
        $room = $this->makeRoom(100, null, 20);

        $data = $this->quote(['room_ids' => [$room->id]])->assertOk()->json('data');

        $this->assertSame(20.0, (float) $data['rooms'][0]['discount_percent']);
        $this->assertSame(60.0, (float) $data['room_discount_total']);
    }

    public function test_quote_rejects_an_unavailable_room(): void
    {
        $room = $this->makeRoom(100, 10);
        $room->update(['status' => 'maintenance']);

        $this->quote(['room_ids' => [$room->id]])
            ->assertStatus(422)
            ->assertJsonValidationErrors('room_ids');
    }

    public function test_quote_rejects_a_stay_that_exceeds_occupancy(): void
    {
        $room = $this->makeRoom(100, 10);

        $this->quote(['room_ids' => [$room->id], 'adults' => 9])
            ->assertStatus(422)
            ->assertJsonValidationErrors('adults');
    }

    public function test_quote_rejects_reversed_dates(): void
    {
        $room = $this->makeRoom(100, 10);

        $this->quote(['room_ids' => [$room->id], 'check_in' => '2027-03-04', 'check_out' => '2027-03-01'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('check_out');
    }

    // ── Dashboard writes / validation ────────────────────────────────────────

    public function test_admin_can_set_a_room_discount(): void
    {
        Sanctum::actingAs($this->admin);
        $room = $this->makeRoom(100, null, 0);

        $this->putJson("/api/admin/rooms/{$room->id}", ['discount_percent' => 15])->assertOk();

        $this->assertSame(15.0, (float) $room->fresh()->discount_percent);
    }

    public function test_admin_can_set_a_room_type_discount(): void
    {
        Sanctum::actingAs($this->admin);
        $room = $this->makeRoom(100, null, 0);

        $this->putJson("/api/admin/room-types/{$room->room_type_id}", ['discount_percent' => 12.5])->assertOk();

        $this->assertSame(12.5, (float) $room->roomType->fresh()->discount_percent);
    }

    /** @dataProvider invalidDiscounts */
    public function test_invalid_room_discounts_are_rejected(mixed $value): void
    {
        Sanctum::actingAs($this->admin);
        $room = $this->makeRoom(100, null, 0);

        $this->putJson("/api/admin/rooms/{$room->id}", ['discount_percent' => $value])
            ->assertStatus(422)
            ->assertJsonValidationErrors('discount_percent');

        $this->assertNull($room->fresh()->discount_percent);
    }

    public static function invalidDiscounts(): array
    {
        return [
            'negative' => [-5],
            'over one hundred' => [101],
            'far over' => [9999],
            'non numeric' => ['fifteen'],
        ];
    }

    public function test_invalid_room_type_discounts_are_rejected(): void
    {
        Sanctum::actingAs($this->admin);
        $room = $this->makeRoom(100, null, 0);

        $this->putJson("/api/admin/room-types/{$room->room_type_id}", ['discount_percent' => 120])
            ->assertStatus(422)
            ->assertJsonValidationErrors('discount_percent');
    }

    public function test_one_hundred_percent_is_accepted(): void
    {
        Sanctum::actingAs($this->admin);
        $room = $this->makeRoom(100, null, 0);

        $this->putJson("/api/admin/rooms/{$room->id}", ['discount_percent' => 100])->assertOk();

        $data = $this->quote(['room_ids' => [$room->id]])->assertOk()->json('data');
        $this->assertSame(0.0, (float) $data['total']);
    }

    // ── Booking ──────────────────────────────────────────────────────────────

    public function test_booking_snapshots_the_discount(): void
    {
        Sanctum::actingAs($this->guest);
        $room = $this->makeRoom(100, 15);

        $booking = $this->createBooking([$room->id]);

        $this->assertSame(300.0, (float) $booking->subtotal);
        $this->assertSame(45.0, (float) $booking->room_discount_total);
        $this->assertSame(45.0, (float) $booking->discount);
        $this->assertSame(25.5, (float) $booking->tax_amount);
        $this->assertSame(25.5, (float) $booking->service_charge_amount);
        $this->assertSame(306.0, (float) $booking->total_amount);

        $pivot = $booking->rooms->first()->pivot;
        $this->assertSame(100.0, (float) $pivot->price_per_night);
        $this->assertSame(3, (int) $pivot->nights);
        $this->assertSame(15.0, (float) $pivot->discount_percent);
        $this->assertSame(45.0, (float) $pivot->discount_amount);
        $this->assertSame(300.0, (float) $pivot->subtotal);
        $this->assertSame(255.0, (float) $pivot->net_subtotal);
    }

    public function test_changing_the_room_discount_later_does_not_move_an_existing_booking(): void
    {
        Sanctum::actingAs($this->guest);
        $room = $this->makeRoom(100, 15);
        $booking = $this->createBooking([$room->id]);

        // Admin runs a bigger campaign afterwards.
        $room->update(['discount_percent' => 50]);

        $booking->refresh();
        $this->assertSame(45.0, (float) $booking->room_discount_total);
        $this->assertSame(306.0, (float) $booking->total_amount);

        // New quotes must reflect the new campaign (different dates, since the
        // room is now blocked for the dates that were just booked).
        $data = $this->quote([
            'room_ids' => [$room->id],
            'check_in' => '2027-04-01',
            'check_out' => '2027-04-04',
        ])->assertOk()->json('data');
        $this->assertSame(150.0, (float) $data['room_discount_total']);
    }

    public function test_editing_a_booking_keeps_the_agreed_rate_and_percentage(): void
    {
        Sanctum::actingAs($this->guest);
        $room = $this->makeRoom(100, 15);
        $booking = $this->createBooking([$room->id]);

        $room->update(['discount_percent' => 50, 'price_per_night' => 400]);

        $this->putJson("/api/customer/bookings/{$booking->id}", ['adults' => 1])->assertOk();

        $booking->refresh();
        $this->assertSame(300.0, (float) $booking->subtotal);
        $this->assertSame(45.0, (float) $booking->room_discount_total);
        $this->assertSame(306.0, (float) $booking->total_amount);
    }

    public function test_extending_a_stay_respells_the_agreed_rate_over_the_new_nights(): void
    {
        Sanctum::actingAs($this->guest);
        $room = $this->makeRoom(100, 15);
        $booking = $this->createBooking([$room->id]);

        $room->update(['discount_percent' => 50]);

        // 3 nights -> 4 nights, still $100 at 15%.
        $this->putJson("/api/customer/bookings/{$booking->id}", [
            'check_in' => '2027-03-01', 'check_out' => '2027-03-05',
        ])->assertOk();

        $booking->refresh();
        $this->assertSame(400.0, (float) $booking->subtotal);
        $this->assertSame(60.0, (float) $booking->room_discount_total);
        $this->assertSame(408.0, (float) $booking->total_amount);
    }

    public function test_client_supplied_money_is_ignored(): void
    {
        Sanctum::actingAs($this->guest);
        $room = $this->makeRoom(100, 15);

        $response = $this->postJson('/api/customer/bookings', [
            'resort_id' => $this->resort->id,
            'room_ids' => [$room->id],
            'check_in' => '2027-03-01',
            'check_out' => '2027-03-04',
            'adults' => 2,
            // All of this is hostile input.
            'discount' => 290,
            'subtotal' => 1,
            'total_amount' => 1,
            'room_discount_total' => 290,
        ])->assertCreated();

        $booking = Booking::findOrFail($response->json('data.id'));
        $this->assertSame(300.0, (float) $booking->subtotal);
        $this->assertSame(45.0, (float) $booking->discount);
        $this->assertSame(306.0, (float) $booking->total_amount);
    }

    public function test_a_guest_cannot_waive_tax_or_service_charge(): void
    {
        Sanctum::actingAs($this->guest);
        $room = $this->makeRoom(100, 15);

        $response = $this->postJson('/api/customer/bookings', [
            'resort_id' => $this->resort->id,
            'room_ids' => [$room->id],
            'check_in' => '2027-03-01',
            'check_out' => '2027-03-04',
            'adults' => 2,
            'tax_amount' => 0,
            'service_charge_amount' => 0,
        ])->assertCreated();

        $booking = Booking::findOrFail($response->json('data.id'));
        $this->assertSame(25.5, (float) $booking->tax_amount);
        $this->assertSame(25.5, (float) $booking->service_charge_amount);
        $this->assertSame(306.0, (float) $booking->total_amount);
    }

    public function test_staff_may_still_override_tax_and_service_charge(): void
    {
        Sanctum::actingAs($this->admin);
        $room = $this->makeRoom(100, 15);

        $response = $this->postJson('/api/customer/bookings', [
            'resort_id' => $this->resort->id,
            'room_ids' => [$room->id],
            'check_in' => '2027-03-01',
            'check_out' => '2027-03-04',
            'adults' => 2,
            'tax_amount' => 10,
            'service_charge_amount' => 5,
        ])->assertCreated();

        $booking = Booking::findOrFail($response->json('data.id'));
        $this->assertSame(10.0, (float) $booking->tax_amount);
        $this->assertSame(5.0, (float) $booking->service_charge_amount);
        $this->assertSame(270.0, (float) $booking->total_amount); // 255 + 10 + 5
    }

    public function test_multiple_rooms_over_multiple_nights(): void
    {
        Sanctum::actingAs($this->guest);
        $a = $this->makeRoom(100, 15, 0, 'A-1');
        $b = $this->makeRoom(250, 20, 0, 'A-2');

        $booking = $this->createBooking([$a->id, $b->id], '2027-03-01', '2027-03-06'); // 5 nights

        // a: 500 gross, 75 off. b: 1250 gross, 250 off.
        $this->assertSame(1750.0, (float) $booking->subtotal);
        $this->assertSame(325.0, (float) $booking->room_discount_total);
        $this->assertSame(1710.0, (float) $booking->total_amount); // 1425 + 142.50 + 142.50
    }

    public function test_coupon_and_room_discount_do_not_stack_twice(): void
    {
        Sanctum::actingAs($this->guest);
        $room = $this->makeRoom(100, 15);
        Coupon::create([
            'code' => 'SOLARA10', 'type' => 'percent', 'value' => 10,
            'min_order' => 0, 'status' => 'active',
        ]);

        $booking = $this->createBooking([$room->id], '2027-03-01', '2027-03-04', ['coupon_code' => 'SOLARA10']);

        $this->assertSame(300.0, (float) $booking->subtotal);
        $this->assertSame(45.0, (float) $booking->room_discount_total);
        // 10% of the discounted 255, not of the gross 300.
        $this->assertSame(70.5, (float) $booking->discount);
        $this->assertSame(275.4, (float) $booking->total_amount);
    }

    public function test_unknown_coupon_is_rejected(): void
    {
        Sanctum::actingAs($this->guest);
        $room = $this->makeRoom(100, 15);

        $this->postJson('/api/customer/bookings', [
            'resort_id' => $this->resort->id,
            'room_ids' => [$room->id],
            'check_in' => '2027-03-01',
            'check_out' => '2027-03-04',
            'coupon_code' => 'NOPE',
        ])->assertStatus(422)->assertJsonValidationErrors('coupon_code');
    }

    // ── Payment + Invoice ────────────────────────────────────────────────────

    public function test_payment_uses_the_authoritative_total_and_writes_the_invoice(): void
    {
        $room = $this->makeRoom(100, 15);
        Sanctum::actingAs($this->guest);
        $booking = $this->createBooking([$room->id]);

        Sanctum::actingAs($this->admin);
        $response = $this->postJson('/api/customer/payments', [
            'booking_id' => $booking->id,
            'payment_method' => 'qr_code',
        ])->assertCreated();

        $data = $response->json('data');
        $this->assertSame(306.0, (float) $data['amount']);
        $this->assertSame(300.0, (float) $data['breakdown']['subtotal']);
        $this->assertSame(45.0, (float) $data['breakdown']['room_discount_total']);
        $this->assertSame(15.0, (float) $data['breakdown']['room_discount_percent']);
        $this->assertSame(0.0, (float) $data['breakdown']['coupon_discount']);
        $this->assertSame(255.0, (float) $data['breakdown']['discounted_subtotal']);
        $this->assertSame(25.5, (float) $data['breakdown']['tax']);
        $this->assertSame(25.5, (float) $data['breakdown']['service_charge']);
        $this->assertSame(306.0, (float) $data['breakdown']['total']);

        // Per-room snapshot travels onto the receipt.
        $line = $data['reference']['rooms'][0];
        $this->assertSame(15.0, (float) $line['discount_percent']);
        $this->assertSame(45.0, (float) $line['discount_amount']);
        $this->assertSame(255.0, (float) $line['net_subtotal']);

        $invoice = $booking->fresh()->invoice;
        $this->assertNotNull($invoice);
        $this->assertSame(300.0, (float) $invoice->amount);
        $this->assertSame(45.0, (float) $invoice->discount);
        $this->assertSame(25.5, (float) $invoice->tax);
        $this->assertSame(25.5, (float) $invoice->service_charge);
        $this->assertSame(306.0, (float) $invoice->total);
        $this->assertSame('paid', $invoice->status);

        $this->assertSame(0.0, (float) $booking->fresh()->balance_due);
    }

    public function test_payment_cannot_exceed_the_authoritative_total(): void
    {
        $room = $this->makeRoom(100, 15);
        Sanctum::actingAs($this->guest);
        $booking = $this->createBooking([$room->id]);

        Sanctum::actingAs($this->admin);
        $this->postJson('/api/customer/payments', [
            'booking_id' => $booking->id,
            'payment_method' => 'qr_code',
            'amount' => 1000,
        ])->assertStatus(422)->assertJsonValidationErrors('amount');
    }

    public function test_booking_rooms_pivot_cannot_be_written_directly(): void
    {
        Sanctum::actingAs($this->admin);
        $room = $this->makeRoom(100, 15);
        $other = $this->makeRoom(100, 15, 0, 'A-9');
        Sanctum::actingAs($this->guest);
        $booking = $this->createBooking([$room->id]);

        Sanctum::actingAs($this->admin);
        $this->postJson('/api/admin/booking-rooms', [
            'booking_id' => $booking->id,
            'room_id' => $other->id,
            // Attempted tampering.
            'price_per_night' => 1,
            'subtotal' => 1,
            'discount_amount' => 999,
            'discount_percent' => 99,
        ])->assertCreated();

        $booking->refresh()->load('rooms');
        $this->assertCount(2, $booking->rooms);
        foreach ($booking->rooms as $r) {
            $this->assertSame(100.0, (float) $r->pivot->price_per_night);
            $this->assertSame(15.0, (float) $r->pivot->discount_percent);
            $this->assertSame(45.0, (float) $r->pivot->discount_amount);
        }
        $this->assertSame(600.0, (float) $booking->subtotal);
        $this->assertSame(90.0, (float) $booking->room_discount_total);
    }

    protected function createBooking(array $roomIds, string $in = '2027-03-01', string $out = '2027-03-04', array $extra = []): Booking
    {
        $response = $this->postJson('/api/customer/bookings', array_merge([
            'resort_id' => $this->resort->id,
            'room_ids' => $roomIds,
            'check_in' => $in,
            'check_out' => $out,
            'adults' => 2,
        ], $extra))->assertCreated();

        return Booking::with('rooms')->findOrFail($response->json('data.id'));
    }
}
