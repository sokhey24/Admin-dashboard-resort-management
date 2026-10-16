<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Resort;
use App\Models\Role;
use App\Models\RoomType;
use App\Models\User;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RoomTypeBranchNameUniqueTest extends TestCase
{
    protected Resort $resort;

    protected Branch $branchA;

    protected Branch $branchB;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->resort = Resort::create([
            'name' => 'Solara',
            'slug' => 'solara-unique-type',
            'address' => 'Main',
            'city' => 'Phnom Penh',
        ]);

        $this->branchA = Branch::create([
            'resort_id' => $this->resort->id,
            'name' => 'Branch A',
            'address' => 'A',
            'status' => 'active',
        ]);

        $this->branchB = Branch::create([
            'resort_id' => $this->resort->id,
            'name' => 'Branch B',
            'address' => 'B',
            'status' => 'active',
        ]);

        $this->admin = User::create([
            'name' => 'Admin',
            'email' => 'admin-unique-type@example.com',
            'password' => bcrypt('secret'),
        ]);
        $adminRole = Role::create(['name' => 'admin', 'display_name' => 'Admin']);
        $this->admin->roles()->attach($adminRole->id);

        Sanctum::actingAs($this->admin);
    }

    public function test_same_name_allowed_on_different_branches(): void
    {
        RoomType::create([
            'resort_id' => $this->resort->id,
            'branch_id' => $this->branchA->id,
            'name' => 'Deluxe',
            'base_price' => 100,
            'max_occupancy' => 2,
        ]);

        $this->postJson('/api/admin/room-types', [
            'resort_id' => $this->resort->id,
            'branch_id' => $this->branchB->id,
            'name' => 'Deluxe',
            'base_price' => 120,
            'max_occupancy' => 2,
        ])->assertCreated();
    }

    public function test_duplicate_name_rejected_within_same_branch(): void
    {
        RoomType::create([
            'resort_id' => $this->resort->id,
            'branch_id' => $this->branchA->id,
            'name' => 'Garden View',
            'base_price' => 90,
            'max_occupancy' => 2,
        ]);

        $this->postJson('/api/admin/room-types', [
            'resort_id' => $this->resort->id,
            'branch_id' => $this->branchA->id,
            'name' => 'Garden View',
            'base_price' => 95,
            'max_occupancy' => 2,
        ])->assertStatus(422)->assertJsonValidationErrors(['name']);
    }
}
