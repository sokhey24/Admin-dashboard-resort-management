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

class RestaurantMenuCatalogTest extends TestCase
{
    private Resort $resort;

    private Branch $branch;

    private FoodCategory $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->resort = Resort::create([
            'name' => 'Menu Test Resort',
            'slug' => 'menu-test-resort',
            'address' => 'Street',
            'city' => 'Phnom Penh',
        ]);

        $this->branch = Branch::create([
            'resort_id' => $this->resort->id,
            'name' => 'Main Branch',
            'address' => 'Street',
            'status' => 'active',
        ]);

        $this->category = FoodCategory::create([
            'resort_id' => $this->resort->id,
            'branch_id' => $this->branch->id,
            'name' => 'Mains',
            'status' => 'active',
        ]);
    }

    public function test_guest_index_returns_available_items_only(): void
    {
        $available = MenuItem::create([
            'food_category_id' => $this->category->id,
            'name' => 'Lok Lak',
            'price' => 22,
            'is_available' => true,
            'status' => 'active',
        ]);

        MenuItem::create([
            'food_category_id' => $this->category->id,
            'name' => 'Hidden Soup',
            'price' => 10,
            'is_available' => false,
            'status' => 'active',
        ]);

        $response = $this->getJson('/api/customer/menu-items');

        $response->assertOk();
        $ids = collect($response->json())->pluck('id')->all();
        $this->assertContains($available->id, $ids);
        $this->assertCount(1, $ids);
    }

    public function test_guest_can_fetch_menu_item_by_id(): void
    {
        $item = MenuItem::create([
            'food_category_id' => $this->category->id,
            'name' => 'Amok',
            'price' => 18.5,
            'is_available' => true,
            'status' => 'active',
        ]);

        $this->getJson('/api/customer/menu-items/'.$item->id)
            ->assertOk()
            ->assertJsonPath('id', $item->id)
            ->assertJsonPath('name', 'Amok');
    }

    public function test_admin_can_create_and_update_menu_item(): void
    {
        Sanctum::actingAs($this->admin());

        $create = $this->postJson('/api/admin/menu-items', [
            'food_category_id' => $this->category->id,
            'name' => 'Pepper Crab',
            'price' => 42,
            'is_available' => true,
            'status' => 'active',
        ]);

        $create->assertCreated()->assertJsonPath('name', 'Pepper Crab');
        $id = $create->json('id');

        $this->putJson('/api/admin/menu-items/'.$id, [
            'name' => 'Kep Pepper Crab',
            'is_available' => false,
        ])->assertOk()->assertJsonPath('name', 'Kep Pepper Crab')
            ->assertJsonPath('is_available', false);

        $this->assertDatabaseHas('menu_items', [
            'id' => $id,
            'name' => 'Kep Pepper Crab',
            'is_available' => 0,
        ]);
    }

    public function test_cannot_delete_category_with_menu_items(): void
    {
        Sanctum::actingAs($this->admin());

        MenuItem::create([
            'food_category_id' => $this->category->id,
            'name' => 'Linked Dish',
            'price' => 12,
            'is_available' => true,
            'status' => 'active',
        ]);

        $this->deleteJson('/api/admin/food-categories/'.$this->category->id)
            ->assertStatus(422);

        $this->assertDatabaseHas('food_categories', ['id' => $this->category->id]);
    }

    public function test_admin_can_create_and_delete_empty_category(): void
    {
        Sanctum::actingAs($this->admin());

        $create = $this->postJson('/api/admin/food-categories', [
            'resort_id' => $this->resort->id,
            'branch_id' => $this->branch->id,
            'name' => 'Drinks',
            'status' => 'active',
        ]);

        $create->assertCreated()->assertJsonPath('name', 'Drinks');
        $id = $create->json('id');

        $this->deleteJson('/api/admin/food-categories/'.$id)->assertNoContent();
        $this->assertDatabaseMissing('food_categories', ['id' => $id]);
    }

    private function admin(): User
    {
        $role = Role::firstOrCreate(
            ['name' => 'admin'],
            ['display_name' => 'Admin']
        );
        $user = User::factory()->create();
        $user->roles()->attach($role->id);

        return $user;
    }
}
