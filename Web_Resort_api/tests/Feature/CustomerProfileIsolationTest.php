<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CustomerProfileIsolationTest extends TestCase
{
    use RefreshDatabase;

    protected function customer(string $email, string $name): User
    {
        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password' => bcrypt('password'),
            'status' => 'active',
        ]);
        $role = Role::firstOrCreate(['name' => 'customer'], ['display_name' => 'Customer']);
        $user->roles()->attach($role->id);

        return $user;
    }

    public function test_auth_me_returns_only_authenticated_customer_profile(): void
    {
        $sophea = $this->customer('sophea@example.com', 'Sophea Meas');
        $dara = $this->customer('dara@example.com', 'Dara Chann');

        Sanctum::actingAs($sophea);
        $sopheaMe = $this->getJson('/api/auth/me')->assertOk()->json('user');
        $this->assertSame('Sophea Meas', $sopheaMe['name']);
        $this->assertSame('sophea@example.com', $sopheaMe['email']);

        Sanctum::actingAs($dara);
        $daraMe = $this->getJson('/api/auth/me')->assertOk()->json('user');
        $this->assertSame('Dara Chann', $daraMe['name']);
        $this->assertSame('dara@example.com', $daraMe['email']);
        $this->assertNotSame($sopheaMe['id'], $daraMe['id']);
    }

    public function test_auth_me_requires_authentication(): void
    {
        $this->getJson('/api/auth/me')->assertUnauthorized();
    }
}
