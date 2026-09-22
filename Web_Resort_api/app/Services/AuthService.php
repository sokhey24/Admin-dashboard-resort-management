<?php

namespace App\Services;

use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function __construct(protected GuestProfileService $guestProfiles) {}

    public function login(array $credentials): array
    {
        if (!Auth::attempt($credentials)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $user  = Auth::user();
        if ($user->isGuestAccount()) {
            $this->guestProfiles->syncFromUser($user);
        }
        $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'user'         => $this->formatUser($user),
            'access_token' => $token,
            'token_type'   => 'Bearer',
        ];
    }

    public function register(array $data): array
    {
        $profileImage = null;
        if (isset($data['profile_image'])) {
            $profileImage = $data['profile_image']->store('profile_images', 'public');
        }

        $user = User::create([
            'name'          => $data['name'],
            'email'         => $data['email'],
            'phone'         => $data['phone'] ?? null,
            'password'      => Hash::make($data['password']),
            'gender'        => $data['gender']        ?? null,
            'date_of_birth' => $data['date_of_birth'] ?? null,
            'address'       => $data['address']       ?? null,
            'profile_image' => $profileImage,
        ]);

        $customerRole = Role::where('name', 'customer')->first();
        if ($customerRole) {
            $user->roles()->syncWithoutDetaching([$customerRole->id]);
        }
        $user->load('roles');
        $this->guestProfiles->syncFromUser($user);

        $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'user'         => $this->formatUser($user),
            'access_token' => $token,
            'token_type'   => 'Bearer',
        ];
    }

    private function formatUser(User $user): array
    {
        $data = $user->toArray();
        $data['profile_image_url'] = $user->profile_image
            ? asset('storage/' . $user->profile_image)
            : null;
        return $data;
    }
}
