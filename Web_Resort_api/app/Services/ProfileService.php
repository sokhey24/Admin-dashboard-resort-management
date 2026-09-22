<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Throwable;

class ProfileService
{
    public const ALLOWED_PROFILE_FIELDS = ['name', 'phone', 'gender', 'date_of_birth', 'address', 'profile_image'];

    public const PROTECTED_FIELDS = [
        'id', 'email', 'password', 'status', 'role', 'roles', 'role_id',
        'permissions', 'permission', 'google_id', 'google_token', 'is_google_account',
        'email_verified_at', 'remember_token', 'two_factor_secret',
        'two_factor_recovery_codes', 'two_factor_confirmed_at', 'last_login_at',
        'created_at', 'updated_at', 'preferences',
    ];

    public function __construct(
        protected ActivityLogger $activityLogger,
        protected TwoFactorService $twoFactor
    ) {}

    public function updateProfile(User $user, array $data): User
    {
        $data = $this->onlyAllowed($data);

        return DB::transaction(function () use ($user, $data) {
            $changes = [];

            foreach (['name', 'phone', 'gender', 'date_of_birth', 'address'] as $field) {
                if (array_key_exists($field, $data) && (string) $user->$field !== (string) $data[$field]) {
                    $changes[$field] = [
                        'old' => $user->$field,
                        'new' => $data[$field],
                    ];
                }
            }

            if (isset($data['profile_image']) && $data['profile_image'] instanceof UploadedFile) {
                $this->assertValidImage($data['profile_image']);

                if ($user->profile_image) {
                    Storage::disk('public')->delete($user->profile_image);
                }

                $image = $data['profile_image'];
                $filename = 'profile_' . $user->id . '_' . time() . '.' . strtolower($image->getClientOriginalExtension());
                $path = $image->storeAs('profile_images', $filename, 'public');

                $data['profile_image'] = $path;
                $changes['profile_image'] = ['old' => $user->profile_image, 'new' => $path];
            }

            $user->fill($data)->save();

            if (!empty($changes)) {
                $this->activityLogger->log($user, 'profile_updated', 'Profile information updated', $changes);
            }

            return $user->fresh(['roles']);
        });
    }

    public function changePassword(User $user, string $currentPassword, string $newPassword): bool
    {
        if (!Hash::check($currentPassword, $user->password)) {
            throw new \Exception('Current password is incorrect');
        }

        return DB::transaction(function () use ($user, $newPassword) {
            $user->update([
                'password' => Hash::make($newPassword),
            ]);

            $currentToken = $user->currentAccessToken();
            if ($currentToken) {
                $user->tokens()->where('id', '!=', $currentToken->id)->delete();
            }

            $this->activityLogger->log($user, 'password_changed', 'Password changed successfully');

            return true;
        });
    }

    public function uploadAvatar(User $user, UploadedFile $file): string
    {
        $this->assertValidImage($file);

        return DB::transaction(function () use ($user, $file) {
            if ($user->profile_image) {
                Storage::disk('public')->delete($user->profile_image);
            }

            $filename = 'avatar_' . $user->id . '_' . time() . '.' . strtolower($file->getClientOriginalExtension());
            $path = $file->storeAs('profile_images', $filename, 'public');

            $user->update(['profile_image' => $path]);
            $this->activityLogger->log($user, 'avatar_uploaded', 'Profile photo updated');

            return $this->imageUrl($path);
        });
    }

    public function deleteAvatar(User $user): bool
    {
        return DB::transaction(function () use ($user) {
            if ($user->profile_image) {
                Storage::disk('public')->delete($user->profile_image);
                $user->update(['profile_image' => null]);
                $this->activityLogger->log($user, 'avatar_deleted', 'Profile photo removed');
            }

            return true;
        });
    }

    public function getActiveSessions(User $user): array
    {
        $currentId = $user->currentAccessToken()?->id;
        $sessions = [];

        foreach ($user->tokens()->orderByDesc('last_used_at')->get() as $token) {
            $sessions[] = [
                'id' => $token->id,
                'name' => $token->name ?: 'Unknown device',
                'last_used_at' => $token->last_used_at?->diffForHumans() ?? 'Never',
                'last_used_at_full' => $token->last_used_at?->format('Y-m-d H:i:s'),
                'created_at' => $token->created_at?->diffForHumans(),
                'created_at_full' => $token->created_at?->format('Y-m-d H:i:s'),
                'is_current' => $currentId !== null && $token->id === $currentId,
            ];
        }

        return $sessions;
    }

    public function revokeSession(User $user, int $tokenId): bool
    {
        $currentTokenId = $user->currentAccessToken()?->id;

        if ($tokenId === $currentTokenId) {
            throw new \Exception('Cannot revoke the current session. Please use logout instead.');
        }

        $deleted = $user->tokens()->where('id', $tokenId)->delete();

        if ($deleted) {
            $this->activityLogger->log($user, 'session_revoked', 'A session was revoked', ['token_id' => $tokenId]);
        }

        return (bool) $deleted;
    }

    public function revokeAllOtherSessions(User $user): int
    {
        $currentToken = $user->currentAccessToken();
        $query = $user->tokens();
        if ($currentToken) {
            $query->where('id', '!=', $currentToken->id);
        }
        $count = (clone $query)->count();
        $query->delete();

        if ($count > 0) {
            $this->activityLogger->log($user, 'all_sessions_revoked', "Logged out from {$count} other device(s)");
        }

        return $count;
    }

    public function getActivityHistory(User $user, int $limit = 50): array
    {
        if (!Schema::hasTable('activity_logs')) {
            return [];
        }

        return ActivityLog::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(min($limit, 100))
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'action' => $log->action,
                    'description' => $log->description,
                    'ip_address' => $log->ip_address,
                    'user_agent' => $this->parseUserAgent($log->user_agent ?? null),
                    'created_at' => $log->created_at?->diffForHumans(),
                    'created_at_full' => $log->created_at?->format('Y-m-d H:i:s'),
                ];
            })
            ->toArray();
    }

    public function updatePreferences(User $user, array $preferences): array
    {
        $defaults = $this->defaultPreferences();
        $current = is_array($user->preferences) ? $user->preferences : [];
        $merged = array_replace_recursive($defaults, $current, $preferences);

        return DB::transaction(function () use ($user, $merged) {
            $user->update(['preferences' => $merged]);
            $this->activityLogger->log($user, 'preferences_updated', 'Account preferences updated');

            return $merged;
        });
    }

    public function defaultPreferences(): array
    {
        return [
            'theme' => 'light',
            'language' => 'en',
            'notifications' => [
                'email' => true,
                'system' => true,
                'booking' => true,
                'restaurant' => true,
                'payment' => true,
                'marketing' => false,
            ],
        ];
    }

    public function getPreferences(User $user): array
    {
        return array_replace_recursive($this->defaultPreferences(), $user->preferences ?? []);
    }

    public function beginTwoFactorSetup(User $user): array
    {
        $secret = $this->twoFactor->generateSecret();
        $recoveryCodes = $this->twoFactor->generateRecoveryCodes();

        $user->forceFill([
            'two_factor_secret' => encrypt($secret),
            'two_factor_recovery_codes' => $this->twoFactor->hashRecoveryCodes($recoveryCodes),
            'two_factor_confirmed_at' => null,
        ])->save();

        $this->activityLogger->log($user, 'two_factor_setup_started', 'Two-factor authentication setup started');

        return [
            'secret' => $secret,
            'otpauth_url' => $this->twoFactor->otpauthUrl($user, $secret),
            'recovery_codes' => $recoveryCodes,
        ];
    }

    public function confirmTwoFactor(User $user, string $code): bool
    {
        $secret = $this->twoFactor->decryptSecret($user->two_factor_secret);
        if (!$secret || !$this->twoFactor->verify($secret, $code)) {
            throw new \Exception('Invalid authenticator code.');
        }

        $user->forceFill(['two_factor_confirmed_at' => now()])->save();
        $this->activityLogger->log($user, 'two_factor_enabled', 'Two-factor authentication enabled');

        return true;
    }

    public function disableTwoFactor(User $user, string $password, ?string $code = null): bool
    {
        if (!Hash::check($password, $user->password)) {
            throw new \Exception('Current password is incorrect');
        }

        if ($this->twoFactor->isEnabled($user) && $code) {
            $secret = $this->twoFactor->decryptSecret($user->two_factor_secret);
            $validTotp = $secret && $this->twoFactor->verify($secret, $code);
            $validRecovery = !$validTotp
                && $this->twoFactor->looksLikeRecoveryCode($code)
                && $this->twoFactor->consumeRecoveryCode($user, $code);
            if (!$validTotp && !$validRecovery) {
                throw new \Exception('Invalid authenticator or recovery code.');
            }
        }

        $user->forceFill([
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ])->save();

        $this->activityLogger->log($user, 'two_factor_disabled', 'Two-factor authentication disabled');

        return true;
    }

    public function recordLogin(User $user): void
    {
        $user->forceFill(['last_login_at' => now()])->save();
        $this->activityLogger->log($user, 'login', 'Signed in successfully');
    }

    public function statistics(User $user): array
    {
        $bookings = 0;
        if (Schema::hasTable('bookings') && Schema::hasColumn('bookings', 'user_id')) {
            $bookings = (int) DB::table('bookings')->where('user_id', $user->id)->count();
        }

        $reviews = 0;
        if (Schema::hasTable('reviews') && Schema::hasColumn('reviews', 'user_id')) {
            $reviews = (int) DB::table('reviews')->where('user_id', $user->id)->count();
        }

        $sessions = (int) $user->tokens()->count();

        $days = 0;
        if ($user->created_at) {
            // Carbon 3 diffInDays() returns a signed float. Membership age is
            // whole calendar days from created_at (date) through today.
            $days = (int) $user->created_at
                ->copy()
                ->startOfDay()
                ->diffInDays(now()->startOfDay(), true);
        }

        return [
            'total_bookings' => $bookings,
            'total_reviews' => $reviews,
            'active_sessions' => $sessions,
            'account_age_days' => $days,
            'last_activity' => $user->tokens()->latest('last_used_at')->first()?->last_used_at?->diffForHumans(),
        ];
    }

    public function formatUser(User $user): array
    {
        $user->loadMissing('roles');

        $resorts = [];
        try {
            if (Schema::hasTable('user_resort')) {
                $resorts = $user->resorts()->with('branches:id,resort_id,name')->get()->map(function ($resort) {
                    $primaryBranch = $resort->branches->first();

                    return [
                        'id' => $resort->id,
                        'name' => $resort->name,
                        'assignment_role' => $resort->pivot->role,
                        'is_primary' => (bool) $resort->pivot->is_primary,
                        'branch' => $primaryBranch ? ['id' => $primaryBranch->id, 'name' => $primaryBranch->name] : null,
                    ];
                })->values()->all();
            }
        } catch (Throwable) {
            $resorts = [];
        }

        $primary = collect($resorts)->firstWhere('is_primary', true) ?? ($resorts[0] ?? null);

        return [
            'id' => $user->id,
            'account_id' => 'ACC-' . str_pad((string) $user->id, 6, '0', STR_PAD_LEFT),
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'gender' => $user->gender,
            'date_of_birth' => $user->date_of_birth?->format('Y-m-d'),
            'address' => $user->address,
            'status' => $user->status,
            'profile_image' => $user->profile_image,
            'profile_image_url' => $this->imageUrl($user->profile_image),
            'roles' => $user->roles->pluck('name')->values(),
            'assigned_resorts' => $resorts,
            'assigned_resort' => $primary['name'] ?? null,
            'assigned_branch' => $primary['branch']['name'] ?? null,
            'two_factor_enabled' => $this->twoFactor->isEnabled($user),
            'last_login_at' => $user->last_login_at?->format('Y-m-d H:i:s'),
            'last_login_human' => $user->last_login_at?->diffForHumans(),
            'created_at' => $user->created_at?->format('Y-m-d H:i:s'),
            'created_at_human' => $user->created_at?->diffForHumans(),
            'updated_at' => $user->updated_at?->format('Y-m-d H:i:s'),
            'preferences' => $this->getPreferences($user),
        ];
    }

    private function onlyAllowed(array $data): array
    {
        foreach (self::PROTECTED_FIELDS as $field) {
            unset($data[$field]);
        }

        return array_intersect_key($data, array_flip(self::ALLOWED_PROFILE_FIELDS));
    }

    private function assertValidImage(UploadedFile $file): void
    {
        $extension = strtolower($file->getClientOriginalExtension());
        $mime = strtolower((string) $file->getMimeType());
        $allowedExt = ['jpg', 'jpeg', 'png'];
        $allowedMime = ['image/jpeg', 'image/png'];

        if (!in_array($extension, $allowedExt, true) || !in_array($mime, $allowedMime, true)) {
            throw new \Exception('Invalid image format. Only JPG, JPEG, and PNG are allowed.');
        }

        if ($file->getSize() > 2048 * 1024) {
            throw new \Exception('Image size exceeds 2MB limit.');
        }
    }

    private function imageUrl(?string $path): ?string
    {
        if (!$path) {
            return null;
        }

        return asset('storage/' . ltrim($path, '/'));
    }

    private function parseUserAgent(?string $userAgent): array
    {
        if (!$userAgent) {
            return ['browser' => 'Unknown', 'platform' => 'Unknown', 'full' => null];
        }

        $browser = 'Unknown';
        if (str_contains($userAgent, 'Edg')) {
            $browser = 'Edge';
        } elseif (str_contains($userAgent, 'Chrome')) {
            $browser = 'Chrome';
        } elseif (str_contains($userAgent, 'Firefox')) {
            $browser = 'Firefox';
        } elseif (str_contains($userAgent, 'Safari')) {
            $browser = 'Safari';
        } elseif (str_contains($userAgent, 'Opera') || str_contains($userAgent, 'OPR')) {
            $browser = 'Opera';
        }

        $platform = 'Unknown';
        if (str_contains($userAgent, 'Windows')) {
            $platform = 'Windows';
        } elseif (str_contains($userAgent, 'Mac')) {
            $platform = 'Mac OS';
        } elseif (str_contains($userAgent, 'Linux')) {
            $platform = 'Linux';
        } elseif (str_contains($userAgent, 'Android')) {
            $platform = 'Android';
        } elseif (str_contains($userAgent, 'iPhone') || str_contains($userAgent, 'iPad')) {
            $platform = 'iOS';
        }

        return [
            'browser' => $browser,
            'platform' => $platform,
            'full' => $userAgent,
        ];
    }
}
