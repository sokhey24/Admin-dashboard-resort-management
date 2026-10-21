<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Branch;
use App\Models\FoodOrder;
use App\Models\Payment;
use App\Models\Permission;
use App\Models\Resort;
use App\Models\RestaurantTable;
use App\Models\Review;
use App\Models\Role;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\User;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthorizationRegressionTest extends TestCase
{
    protected function guestUser(string $email): User
    {
        $user = User::create([
            'name' => 'Guest',
            'email' => $email,
            'password' => bcrypt('secret'),
        ]);
        $role = Role::firstOrCreate(['name' => 'customer'], ['display_name' => 'Customer']);
        $user->roles()->attach($role->id);

        return $user;
    }

    protected function bookingFor(User $user, Resort $resort, Branch $branch, string $roomNumber = '101'): Booking
    {
        $type = RoomType::create([
            'resort_id' => $resort->id,
            'branch_id' => $branch->id,
            'name' => 'Standard',
            'base_price' => 120,
            'max_occupancy' => 4,
        ]);
        $room = Room::create([
            'resort_id' => $resort->id,
            'branch_id' => $branch->id,
            'room_type_id' => $type->id,
            'room_number' => $roomNumber,
            'price_per_night' => 120,
            'status' => 'available',
        ]);

        Sanctum::actingAs($user);

        $id = $this->postJson('/api/customer/bookings', [
            'resort_id' => $resort->id,
            'branch_id' => $branch->id,
            'room_ids' => [$room->id],
            'check_in' => now()->addMonth()->format('Y-m-d'),
            'check_out' => now()->addMonth()->addDays(2)->format('Y-m-d'),
            'adults' => 2,
        ])->assertCreated()->json('data.id');

        return Booking::findOrFail($id);
    }

    public function test_guest_cannot_view_another_guests_booking(): void
    {
        $resort = Resort::create(['name' => 'Solara', 'slug' => 'solara', 'address' => 'A', 'city' => 'B']);
        $branch = Branch::create(['resort_id' => $resort->id, 'name' => 'Main', 'address' => 'A', 'status' => 'active']);

        $owner = $this->guestUser('owner@example.com');
        $intruder = $this->guestUser('intruder@example.com');

        $booking = $this->bookingFor($owner, $resort, $branch);

        Sanctum::actingAs($intruder);
        $this->getJson('/api/customer/bookings/'.$booking->id)->assertForbidden();
    }

    public function test_guest_cannot_view_another_guests_payment(): void
    {
        $resort = Resort::create(['name' => 'Solara', 'slug' => 'solara-pay', 'address' => 'A', 'city' => 'B']);
        $branch = Branch::create(['resort_id' => $resort->id, 'name' => 'Main', 'address' => 'A', 'status' => 'active']);

        $owner = $this->guestUser('pay-owner@example.com');
        $intruder = $this->guestUser('pay-intruder@example.com');

        $booking = $this->bookingFor($owner, $resort, $branch);

        $payment = Payment::create([
            'booking_id' => $booking->id,
            'user_id' => $owner->id,
            'amount' => 100,
            'currency' => 'USD',
            'payment_method' => 'qr_code',
            'status' => 'pending',
            'source' => 'resort',
        ]);

        Sanctum::actingAs($intruder);
        $this->getJson('/api/customer/payments/'.$payment->id)->assertForbidden();
    }

    public function test_guest_cannot_mutate_payment_records(): void
    {
        $resort = Resort::create(['name' => 'Solara', 'slug' => 'solara-mut', 'address' => 'A', 'city' => 'B']);
        $branch = Branch::create(['resort_id' => $resort->id, 'name' => 'Main', 'address' => 'A', 'status' => 'active']);
        $owner = $this->guestUser('mut-owner@example.com');
        $booking = $this->bookingFor($owner, $resort, $branch);

        $payment = Payment::create([
            'booking_id' => $booking->id,
            'user_id' => $owner->id,
            'amount' => 50,
            'currency' => 'USD',
            'payment_method' => 'qr_code',
            'status' => 'pending',
            'source' => 'resort',
        ]);

        Sanctum::actingAs($owner);
        $this->putJson('/api/customer/payments/'.$payment->id, ['status' => 'paid'])->assertForbidden();
        $this->deleteJson('/api/customer/payments/'.$payment->id)->assertForbidden();
    }

    public function test_guest_cannot_view_another_guests_food_order(): void
    {
        $resort = Resort::create(['name' => 'Solara', 'slug' => 'solara-food', 'address' => 'A', 'city' => 'B']);
        $branch = Branch::create(['resort_id' => $resort->id, 'name' => 'Dining', 'address' => 'A', 'status' => 'active']);
        $table = RestaurantTable::create([
            'resort_id' => $resort->id,
            'branch_id' => $branch->id,
            'table_number' => 'T1',
            'capacity' => 4,
            'status' => 'available',
        ]);

        $owner = $this->guestUser('food-owner@example.com');
        $intruder = $this->guestUser('food-intruder@example.com');

        $order = FoodOrder::create([
            'user_id' => $owner->id,
            'restaurant_table_id' => $table->id,
            'branch_id' => $branch->id,
            'order_code' => 'FO-TEST-1',
            'subtotal' => 20,
            'tax' => 2,
            'total' => 22,
            'status' => 'pending',
        ]);

        Sanctum::actingAs($intruder);
        $this->getJson('/api/customer/food-orders/'.$order->id)->assertForbidden();
    }

    public function test_staff_cannot_view_booking_outside_assigned_branch(): void
    {
        $resort = Resort::create(['name' => 'Solara', 'slug' => 'solara-staff', 'address' => 'A', 'city' => 'B']);
        $branchA = Branch::create(['resort_id' => $resort->id, 'name' => 'Branch A', 'address' => 'A', 'status' => 'active']);
        $branchB = Branch::create(['resort_id' => $resort->id, 'name' => 'Branch B', 'address' => 'B', 'status' => 'active']);

        $guest = $this->guestUser('branch-guest@example.com');
        $booking = $this->bookingFor($guest, $resort, $branchB, 'B-201');

        $role = Role::create(['name' => 'resort_staff_auth', 'display_name' => 'Staff']);
        $view = Permission::create(['name' => 'resort.bookings.view', 'description' => 'View bookings']);
        $role->permissions()->attach($view->id);

        $staff = User::create(['name' => 'Staff', 'email' => 'staff-branch@example.com', 'password' => bcrypt('secret')]);
        $staff->roles()->attach($role->id);
        $staff->resorts()->attach($resort->id, ['role' => 'staff', 'is_primary' => true, 'assigned_at' => now()]);
        $staff->branches()->attach($branchA->id, ['role' => 'staff', 'is_primary' => true, 'assigned_at' => now()]);

        Sanctum::actingAs($staff);
        $this->getJson('/api/admin/bookings/'.$booking->id)->assertForbidden();
    }

    public function test_public_review_listing_does_not_expose_reviewer_email(): void
    {
        $resort = Resort::create(['name' => 'Solara', 'slug' => 'solara-rev', 'address' => 'A', 'city' => 'B']);
        $author = $this->guestUser('reviewer@example.com');

        Review::create([
            'user_id' => $author->id,
            'resort_id' => $resort->id,
            'rating' => 5,
            'title' => 'Lovely stay',
            'comment' => 'Would return.',
            'status' => 'approved',
        ]);

        $response = $this->getJson('/api/customer/reviews');
        $response->assertOk();
        $this->assertStringNotContainsString('reviewer@example.com', $response->getContent());
    }
}
