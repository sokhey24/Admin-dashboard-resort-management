<?php

namespace App\Services;

use App\Models\Guest;
use App\Models\User;

/**
 * CRM guest profile linked to a Sanctum user (website register/login).
 */
class GuestProfileService
{
    public function syncFromUser(User $user): Guest
    {
        $existing = Guest::where('user_id', $user->id)->first();
        if ($existing) {
            $existing->fill($this->profileFields($user))->save();

            return $existing;
        }

        $byEmail = $user->email
            ? Guest::whereNull('user_id')->where('email', $user->email)->first()
            : null;

        if ($byEmail) {
            $byEmail->fill(['user_id' => $user->id] + $this->profileFields($user))->save();

            return $byEmail;
        }

        return Guest::create([
            'user_id' => $user->id,
            'guest_code' => $this->nextGuestCode(),
            'status' => 'active',
        ] + $this->profileFields($user));
    }

    public function guestForUser(?User $user): ?Guest
    {
        if (! $user) {
            return null;
        }

        return Guest::where('user_id', $user->id)->first()
            ?? ($user->isGuestAccount() ? $this->syncFromUser($user) : null);
    }

    protected function profileFields(User $user): array
    {
        $parts = preg_split('/\s+/', trim((string) $user->name), 2) ?: [];

        return [
            'first_name' => $parts[0] ?? (string) $user->name,
            'last_name' => $parts[1] ?? '',
            'email' => $user->email,
            'phone' => $user->phone,
            'gender' => $user->gender,
            'date_of_birth' => $user->date_of_birth,
            'address' => $user->address,
        ];
    }

    protected function nextGuestCode(): string
    {
        $next = (int) Guest::withTrashed()->max('id') + 1;

        return 'GST-'.str_pad((string) $next, 5, '0', STR_PAD_LEFT);
    }
}
