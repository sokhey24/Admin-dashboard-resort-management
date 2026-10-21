<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\Booking;
use App\Models\Branch;
use App\Models\FolioCharge;
use App\Models\GuestFolio;
use App\Models\Permission;
use App\Models\Resort;
use App\Models\Role;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\User;
use App\Models\Payment;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GuestFolioTest extends TestCase
{
    protected function customer(string $email = 'folio-guest@example.com'): User
    {
        $user = User::create([
            'name' => 'Folio Guest',
            'email' => $email,
            'password' => bcrypt('password'),
        ]);
        $role = Role::firstOrCreate(['name' => 'customer'], ['display_name' => 'Customer']);
        $user->roles()->attach($role->id);

        return $user;
    }

    protected function staffForBranch(Resort $resort, Branch $branch, string $email = 'folio-staff@example.com'): User
    {
        $role = Role::create(['name' => 'folio_staff_'.uniqid(), 'display_name' => 'Staff']);
        $role->permissions()->attach(
            Permission::firstOrCreate(['name' => 'resort.bookings.view'], ['description' => 'view'])->id
        );
        $role->permissions()->attach(
            Permission::firstOrCreate(['name' => 'resort.bookings.update'], ['description' => 'update'])->id
        );
        $role->permissions()->attach(
            Permission::firstOrCreate(['name' => 'resort.payments.create'], ['description' => 'pay'])->id
        );

        $staff = User::create(['name' => 'Staff', 'email' => $email, 'password' => bcrypt('secret')]);
        $staff->roles()->attach($role->id);
        $staff->resorts()->attach($resort->id, ['role' => 'staff', 'is_primary' => true, 'assigned_at' => now()]);
        $staff->branches()->attach($branch->id, ['role' => 'staff', 'is_primary' => true, 'assigned_at' => now()]);

        return $staff;
    }

    protected function confirmedBooking(User $guest, Resort $resort, Branch $branch): Booking
    {
        $type = RoomType::create([
            'resort_id' => $resort->id,
            'branch_id' => $branch->id,
            'name' => 'Deluxe',
            'base_price' => 100,
            'max_occupancy' => 4,
        ]);
        $room = Room::create([
            'resort_id' => $resort->id,
            'branch_id' => $branch->id,
            'room_type_id' => $type->id,
            'room_number' => 'F-101',
            'price_per_night' => 100,
            'status' => 'available',
        ]);

        Sanctum::actingAs($guest);
        $id = $this->postJson('/api/customer/bookings', [
            'resort_id' => $resort->id,
            'room_ids' => [$room->id],
            'check_in' => now()->addDays(5)->format('Y-m-d'),
            'check_out' => now()->addDays(7)->format('Y-m-d'),
            'adults' => 2,
        ])->assertCreated()->json('data.id');

        $booking = Booking::findOrFail($id);
        $booking->update(['status' => 'confirmed']);

        return $booking->fresh();
    }

    public function test_staff_posts_incidental_and_balance_updates(): void
    {
        $resort = Resort::create(['name' => 'Folio R', 'slug' => 'folio-r', 'address' => 'a', 'city' => 'c']);
        $branch = Branch::create(['resort_id' => $resort->id, 'name' => 'Main', 'address' => 'a', 'status' => 'active']);
        $guest = $this->customer();
        $booking = $this->confirmedBooking($guest, $resort, $branch);
        $staff = $this->staffForBranch($resort, $branch);

        Sanctum::actingAs($staff);

        $this->postJson("/api/admin/bookings/{$booking->id}/folio/charges", [
            'charge_type' => 'minibar',
            'description' => 'Soft drinks',
            'quantity' => 2,
            'unit_price' => 5.50,
            'idempotency_key' => 'minibar-test-1',
        ])->assertCreated();

        $booking->refresh();
        $expectedIncidental = 11.0;
        $expectedBalance = round((float) $booking->total_amount + $expectedIncidental, 2);
        $this->assertEqualsWithDelta($expectedBalance, (float) $booking->balance_due, 0.01);

        $show = $this->getJson("/api/admin/bookings/{$booking->id}/folio")->assertOk()->json('data.totals');
        $this->assertEqualsWithDelta($expectedIncidental, (float) $show['incidentals_total'], 0.01);
        $this->assertEqualsWithDelta($expectedBalance, (float) $show['balance_due'], 0.01);
    }

    public function test_idempotent_charge_post_returns_single_row(): void
    {
        $resort = Resort::create(['name' => 'Folio I', 'slug' => 'folio-i', 'address' => 'a', 'city' => 'c']);
        $branch = Branch::create(['resort_id' => $resort->id, 'name' => 'Main', 'address' => 'a', 'status' => 'active']);
        $guest = $this->customer('idempotent@example.com');
        $booking = $this->confirmedBooking($guest, $resort, $branch);
        $staff = $this->staffForBranch($resort, $branch, 'staff-idem@example.com');
        Sanctum::actingAs($staff);

        $payload = [
            'charge_type' => 'spa',
            'description' => 'Massage',
            'quantity' => 1,
            'unit_price' => 45,
            'idempotency_key' => 'spa-unique-key',
        ];

        $this->postJson("/api/admin/bookings/{$booking->id}/folio/charges", $payload)->assertCreated();
        $this->postJson("/api/admin/bookings/{$booking->id}/folio/charges", $payload)->assertCreated();

        $this->assertSame(1, FolioCharge::query()->where('idempotency_key', 'spa-unique-key')->count());
    }

    public function test_pending_booking_rejects_charge(): void
    {
        $resort = Resort::create(['name' => 'Folio P', 'slug' => 'folio-p', 'address' => 'a', 'city' => 'c']);
        $branch = Branch::create(['resort_id' => $resort->id, 'name' => 'Main', 'address' => 'a', 'status' => 'active']);
        $guest = $this->customer('pending@example.com');
        $booking = $this->confirmedBooking($guest, $resort, $branch);
        $booking->update(['status' => 'pending']);
        $staff = $this->staffForBranch($resort, $branch, 'staff-p@example.com');
        Sanctum::actingAs($staff);

        $this->postJson("/api/admin/bookings/{$booking->id}/folio/charges", [
            'charge_type' => 'laundry',
            'description' => 'Shirt',
            'quantity' => 1,
            'unit_price' => 8,
        ])->assertStatus(422);
    }

    public function test_void_charge_requires_reason_and_writes_audit(): void
    {
        $resort = Resort::create(['name' => 'Folio V', 'slug' => 'folio-v', 'address' => 'a', 'city' => 'c']);
        $branch = Branch::create(['resort_id' => $resort->id, 'name' => 'Main', 'address' => 'a', 'status' => 'active']);
        $guest = $this->customer('void@example.com');
        $booking = $this->confirmedBooking($guest, $resort, $branch);
        $staff = $this->staffForBranch($resort, $branch, 'staff-v@example.com');
        Sanctum::actingAs($staff);

        $chargeId = $this->postJson("/api/admin/bookings/{$booking->id}/folio/charges", [
            'charge_type' => 'service',
            'description' => 'Late checkout',
            'quantity' => 1,
            'unit_price' => 30,
        ])->assertCreated()->json('data.id');

        $this->postJson("/api/admin/folio-charges/{$chargeId}/void", [])->assertStatus(422);

        $this->postJson("/api/admin/folio-charges/{$chargeId}/void", [
            'void_reason' => 'Posted to wrong room',
        ])->assertOk();

        $booking->refresh();
        $this->assertEqualsWithDelta((float) $booking->total_amount, (float) $booking->balance_due, 0.01);

        $this->assertTrue(
            ActivityLog::query()
                ->where('action', 'folio.charge_voided')
                ->where('model_id', $chargeId)
                ->exists()
        );
    }

    public function test_payment_reduces_folio_balance(): void
    {
        $resort = Resort::create(['name' => 'Folio Pay', 'slug' => 'folio-pay', 'address' => 'a', 'city' => 'c']);
        $branch = Branch::create(['resort_id' => $resort->id, 'name' => 'Main', 'address' => 'a', 'status' => 'active']);
        $guest = $this->customer('pay@example.com');
        $booking = $this->confirmedBooking($guest, $resort, $branch);
        $staff = $this->staffForBranch($resort, $branch, 'staff-pay@example.com');

        Sanctum::actingAs($staff);
        $this->postJson("/api/admin/bookings/{$booking->id}/folio/charges", [
            'charge_type' => 'minibar',
            'description' => 'Snacks',
            'quantity' => 1,
            'unit_price' => 20,
        ])->assertCreated();

        $due = (float) $booking->fresh()->balance_due;

        $this->postJson('/api/admin/payments', [
            'booking_id' => $booking->id,
            'payment_method' => 'cash',
            'amount' => $due,
            'status' => 'paid',
        ])->assertCreated();

        $booking->refresh();
        $this->assertLessThanOrEqual(0.009, (float) $booking->balance_due);
    }

    public function test_guest_can_view_own_folio_not_others(): void
    {
        $resort = Resort::create(['name' => 'Folio G', 'slug' => 'folio-g', 'address' => 'a', 'city' => 'c']);
        $branch = Branch::create(['resort_id' => $resort->id, 'name' => 'Main', 'address' => 'a', 'status' => 'active']);
        $owner = $this->customer('owner-folio@example.com');
        $other = $this->customer('other-folio@example.com');
        $booking = $this->confirmedBooking($owner, $resort, $branch);

        Sanctum::actingAs($owner);
        $this->getJson("/api/customer/bookings/{$booking->id}/folio")->assertOk();

        Sanctum::actingAs($other);
        $this->getJson("/api/customer/bookings/{$booking->id}/folio")->assertForbidden();
    }

    public function test_staff_outside_branch_cannot_view_folio(): void
    {
        $resort = Resort::create(['name' => 'Folio B', 'slug' => 'folio-b', 'address' => 'a', 'city' => 'c']);
        $branchA = Branch::create(['resort_id' => $resort->id, 'name' => 'A', 'address' => 'a', 'status' => 'active']);
        $branchB = Branch::create(['resort_id' => $resort->id, 'name' => 'B', 'address' => 'a', 'status' => 'active']);
        $guest = $this->customer('branch-folio@example.com');
        $booking = $this->confirmedBooking($guest, $resort, $branchA);
        $staffB = $this->staffForBranch($resort, $branchB, 'staff-b-only@example.com');

        Sanctum::actingAs($staffB);
        $this->getJson("/api/admin/bookings/{$booking->id}/folio")->assertForbidden();
    }

    public function test_consolidated_invoice_totals_match_ledger(): void
    {
        $resort = Resort::create(['name' => 'Folio Inv', 'slug' => 'folio-inv', 'address' => 'a', 'city' => 'c']);
        $branch = Branch::create(['resort_id' => $resort->id, 'name' => 'Main', 'address' => 'a', 'status' => 'active']);
        $guest = $this->customer('inv@example.com');
        $booking = $this->confirmedBooking($guest, $resort, $branch);
        $staff = $this->staffForBranch($resort, $branch, 'staff-inv@example.com');

        Sanctum::actingAs($staff);
        $this->postJson("/api/admin/bookings/{$booking->id}/folio/charges", [
            'charge_type' => 'transportation',
            'description' => 'Airport transfer',
            'quantity' => 1,
            'unit_price' => 35,
        ])->assertCreated();

        $ledger = $this->getJson("/api/admin/bookings/{$booking->id}/folio")->assertOk()->json('data.totals');

        Permission::firstOrCreate(['name' => 'payments.pdf'], ['description' => 'pdf']);
        Permission::firstOrCreate(['name' => 'resort.invoices.view'], ['description' => 'inv']);
        $staff->roles()->first()->permissions()->syncWithoutDetaching([
            Permission::where('name', 'payments.pdf')->value('id'),
            Permission::where('name', 'resort.invoices.view')->value('id'),
        ]);

        $this->getJson("/api/admin/bookings/{$booking->id}/folio/pdf")->assertOk();

        $invoice = $booking->fresh()->invoice;
        $this->assertNotNull($invoice);
        $this->assertEqualsWithDelta((float) $ledger['charges_total'], (float) $invoice->total, 0.01);
        $this->assertNotEmpty($invoice->pdf_path);
    }

    public function test_settle_rejects_open_balance(): void
    {
        $resort = Resort::create(['name' => 'Folio S', 'slug' => 'folio-s', 'address' => 'a', 'city' => 'c']);
        $branch = Branch::create(['resort_id' => $resort->id, 'name' => 'Main', 'address' => 'a', 'status' => 'active']);
        $guest = $this->customer('settle@example.com');
        $booking = $this->confirmedBooking($guest, $resort, $branch);
        $staff = $this->staffForBranch($resort, $branch, 'staff-s@example.com');

        Sanctum::actingAs($staff);
        $this->postJson("/api/admin/bookings/{$booking->id}/folio/settle")->assertStatus(422);
    }

    public function test_closed_folio_rejects_new_charges(): void
    {
        $resort = Resort::create(['name' => 'Folio C', 'slug' => 'folio-c', 'address' => 'a', 'city' => 'c']);
        $branch = Branch::create(['resort_id' => $resort->id, 'name' => 'Main', 'address' => 'a', 'status' => 'active']);
        $guest = $this->customer('closed@example.com');
        $booking = $this->confirmedBooking($guest, $resort, $branch);
        $staff = $this->staffForBranch($resort, $branch, 'staff-c@example.com');

        Sanctum::actingAs($staff);

        $due = (float) $booking->total_amount;
        $this->postJson('/api/admin/payments', [
            'booking_id' => $booking->id,
            'payment_method' => 'cash',
            'amount' => $due,
            'status' => 'paid',
        ])->assertCreated();

        $this->postJson("/api/admin/bookings/{$booking->id}/folio/settle")->assertOk();

        $this->postJson("/api/admin/bookings/{$booking->id}/folio/charges", [
            'charge_type' => 'minibar',
            'description' => 'Water',
            'quantity' => 1,
            'unit_price' => 3,
        ])->assertStatus(422);
    }
}
