<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\FoodCategory;
use App\Models\MenuItem;
use App\Models\Resort;
use App\Models\Role;
use App\Models\User;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GuestFoodOrderCheckoutTest extends TestCase
{
    protected function guest(): User
    {
        $user = User::create([
            'name' => 'Diner',
            'email' => 'diner-food@example.com',
            'password' => bcrypt('password'),
        ]);
        $role = Role::firstOrCreate(['name' => 'customer'], ['display_name' => 'Customer']);
        $user->roles()->attach($role->id);

        return $user;
    }

    protected function menuLine(): array
    {
        $resort = Resort::create(['name' => 'R', 'slug' => 'r-food', 'address' => 'a', 'city' => 'c']);
        $branch = Branch::create(['resort_id' => $resort->id, 'name' => 'Dining', 'address' => 'a', 'status' => 'active']);
        $category = FoodCategory::create([
            'resort_id' => $resort->id,
            'branch_id' => $branch->id,
            'name' => 'Mains',
            'status' => 'active',
        ]);
        $item = MenuItem::create([
            'food_category_id' => $category->id,
            'name' => 'Curry',
            'price' => 12.50,
            'is_available' => true,
            'status' => 'active',
        ]);

        return ['item' => $item, 'branch' => $branch];
    }

    public function test_guest_checkout_persists_order_with_server_totals(): void
    {
        ['item' => $item] = $this->menuLine();
        $guest = $this->guest();
        Sanctum::actingAs($guest);

        $payload = [
            'client_request_id' => 'req-'.uniqid(),
            'fulfillment_type' => 'dine_in',
            'payment_method' => 'cash',
            'items' => [
                ['menu_item_id' => $item->id, 'quantity' => 2],
            ],
        ];

        $response = $this->postJson('/api/customer/food-orders', $payload)->assertCreated();
        $data = $response->json('data');
        $this->assertSame(25.0, (float) $data['subtotal']);
        $this->assertNotEmpty($data['order_code']);
        $this->assertDatabaseHas('food_order_items', [
            'menu_item_id' => $item->id,
            'item_name' => 'Curry',
            'quantity' => 2,
        ]);

        $this->postJson('/api/customer/food-orders', $payload)->assertCreated();
        $this->assertSame(1, \App\Models\FoodOrder::where('client_request_id', $payload['client_request_id'])->count());
    }

    public function test_guest_cannot_submit_trusted_client_total(): void
    {
        ['item' => $item] = $this->menuLine();
        Sanctum::actingAs($this->guest());

        $subtotal = 12.50;
        $tax = round($subtotal * (float) config('pricing.tax_rate', 0.10), 2);
        $service = round($subtotal * (float) config('pricing.service_charge_rate', 0.10), 2);
        $expected = round($subtotal + $tax + $service, 2);

        $response = $this->postJson('/api/customer/food-orders', [
            'fulfillment_type' => 'dine_in',
            'payment_method' => 'cash',
            'total' => 0.01,
            'items' => [['menu_item_id' => $item->id, 'quantity' => 1]],
        ])->assertCreated();

        $this->assertEqualsWithDelta($expected, (float) $response->json('data.total'), 0.01);
    }
}
