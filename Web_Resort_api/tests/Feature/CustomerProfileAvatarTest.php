<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CustomerProfileAvatarTest extends TestCase
{

    protected function customer(string $email = 'guest@example.com', string $name = 'Guest User'): User
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

    public function test_customer_can_upload_profile_avatar_and_persist_to_users_table(): void
    {
        Storage::fake('public');

        $user = $this->customer();
        Sanctum::actingAs($user);

        $file = UploadedFile::fake()->image('portrait.jpg', 200, 200);

        $upload = $this->postJson('/api/profile/avatar', ['avatar' => $file])
            ->assertOk()
            ->assertJsonPath('success', true);

        $profile = $upload->json('data.profile');
        $this->assertNotEmpty($profile['profile_image']);
        $this->assertNotEmpty($profile['profile_image_url']);

        $user->refresh();
        $this->assertSame($profile['profile_image'], $user->profile_image);
        Storage::disk('public')->assertExists($user->profile_image);

        $me = $this->getJson('/api/auth/me')->assertOk()->json('user');
        $this->assertSame($user->profile_image, $me['profile_image']);
        $this->assertNotEmpty($me['profile_image_url']);
    }

    public function test_customer_can_delete_profile_avatar(): void
    {
        Storage::fake('public');

        $user = $this->customer();
        Sanctum::actingAs($user);

        $file = UploadedFile::fake()->image('portrait.jpg', 200, 200);
        $this->postJson('/api/profile/avatar', ['avatar' => $file])->assertOk();

        $user->refresh();
        $this->assertNotNull($user->profile_image);

        $this->deleteJson('/api/profile/avatar')
            ->assertOk()
            ->assertJsonPath('success', true);

        $user->refresh();
        $this->assertNull($user->profile_image);

        $me = $this->getJson('/api/auth/me')->assertOk()->json('user');
        $this->assertNull($me['profile_image']);
        $this->assertNull($me['profile_image_url']);
    }

    public function test_profile_get_returns_same_image_fields_as_auth_me(): void
    {
        Storage::fake('public');

        $user = $this->customer();
        Sanctum::actingAs($user);

        $this->postJson('/api/profile/avatar', [
            'avatar' => UploadedFile::fake()->image('portrait.jpg', 150, 150),
        ])->assertOk();

        $fromProfile = $this->getJson('/api/profile')->assertOk()->json('data');
        $fromMe = $this->getJson('/api/auth/me')->assertOk()->json('user');

        $this->assertSame($fromMe['profile_image'], $fromProfile['profile_image']);
        $this->assertSame($fromMe['profile_image_url'], $fromProfile['profile_image_url']);
    }
}
