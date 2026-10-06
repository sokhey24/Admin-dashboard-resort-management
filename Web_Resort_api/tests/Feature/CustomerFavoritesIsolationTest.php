<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CustomerFavoritesIsolationTest extends TestCase
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

    public function test_customer_preferences_favorites_are_scoped_per_user(): void
    {
        $alice = $this->customer('alice@example.com');
        $bob = $this->customer('bob@example.com');

        Sanctum::actingAs($alice);
        $this->putJson('/api/profile/preferences', [
            'favorites' => [
                'resorts' => ['10'],
                'rooms' => [],
            ],
        ])->assertOk();

        Sanctum::actingAs($bob);
        $bobPrefs = $this->getJson('/api/profile/preferences')->assertOk()->json('data.preferences.favorites');
        $this->assertSame([], $bobPrefs['resorts']);
        $this->assertSame([], $bobPrefs['rooms']);

        $alicePrefs = User::find($alice->id)->preferences['favorites'];
        $this->assertSame(['10'], $alicePrefs['resorts']);
    }
}
