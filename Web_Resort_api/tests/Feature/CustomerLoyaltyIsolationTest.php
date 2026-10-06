<?php

namespace Tests\Feature;

use App\Models\CustomerLoyalty;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CustomerLoyaltyIsolationTest extends TestCase
{
    use RefreshDatabase;

    protected function customer(string $email): User
    {
        $user = User::create([
            'name' => 'Guest',
            'email' => $email,
            'password' => bcrypt('password'),
            'status' => 'active',
        ]);
        $role = Role::firstOrCreate(['name' => 'customer'], ['display_name' => 'Customer']);
        $user->roles()->attach($role->id);

        return $user;
    }

    public function test_auth_me_returns_loyalty_for_authenticated_customer_only(): void
    {
        $alice = $this->customer('alice@example.com');
        $bob = $this->customer('bob@example.com');

        CustomerLoyalty::create([
            'user_id' => $alice->id,
            'points' => 14200,
            'tier' => 'Gold Concierge',
            'points_target' => 20000,
        ]);
        CustomerLoyalty::create([
            'user_id' => $bob->id,
            'points' => 8500,
            'tier' => 'Silver',
            'points_target' => 20000,
        ]);

        Sanctum::actingAs($alice);
        $aliceLoyalty = $this->getJson('/api/auth/me')->assertOk()->json('user.loyalty');
        $this->assertSame(14200, $aliceLoyalty['points']);
        $this->assertSame('Gold Concierge', $aliceLoyalty['tier']);

        Sanctum::actingAs($bob);
        $bobLoyalty = $this->getJson('/api/auth/me')->assertOk()->json('user.loyalty');
        $this->assertSame(8500, $bobLoyalty['points']);
        $this->assertSame('Silver', $bobLoyalty['tier']);
    }

    public function test_auth_me_returns_null_loyalty_when_no_record(): void
    {
        $user = $this->customer('none@example.com');
        Sanctum::actingAs($user);

        $loyalty = $this->getJson('/api/auth/me')->assertOk()->json('user.loyalty');
        $this->assertNull($loyalty);
    }
}
