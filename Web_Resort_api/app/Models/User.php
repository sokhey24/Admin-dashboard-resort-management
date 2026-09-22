<?php

namespace App\Models;

use App\Models\PasswordResetOtp;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name', 'email', 'phone', 'password',
        'gender', 'date_of_birth', 'address',
        'status', 'profile_image', 'preferences',
        'last_login_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'google_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'date_of_birth' => 'date',
        'preferences' => 'array',
        'last_login_at' => 'datetime',
        'two_factor_confirmed_at' => 'datetime',
    ];

    public function roles()
    {
        return $this->belongsToMany(Role::class);
    }

    public function guestProfile()
    {
        return $this->hasOne(Guest::class);
    }

    public function resorts()
    {
        return $this->belongsToMany(Resort::class, 'user_resort')
            ->withPivot(['role', 'is_primary', 'assigned_at']);
    }

    public function userPermissions()
    {
        return $this->hasMany(UserPermission::class);
    }

    /**
     * Effective permissions applying priority:
     * 1. Explicit user DENY  (overrides everything)
     * 2. Explicit user ALLOW (grants beyond role)
     * 3. Role permission
     * 4. No permission
     *
     * Returns flat array of allowed permission name strings.
     */
    public function permissions(): array
    {
        $rolePerms = $this->roles()
            ->with('permissions')
            ->get()
            ->flatMap(fn ($role) => $role->permissions->pluck('name'))
            ->unique()
            ->values()
            ->toArray();

        $overrides = $this->userPermissions()->with('permission')->get();
        $userAllow = $overrides->where('effect', 'allow')->pluck('permission.name')->filter()->toArray();
        $userDeny = $overrides->where('effect', 'deny')->pluck('permission.name')->filter()->toArray();

        $effective = array_unique(array_merge($rolePerms, $userAllow));
        $effective = array_values(array_diff($effective, $userDeny));

        return $effective;
    }

    public function hasPermission(string $permission): bool
    {
        return in_array($permission, $this->permissions());
    }

    public function isAdmin(): bool
    {
        return $this->roles()->where('name', 'admin')->exists();
    }

    public function isCustomer(): bool
    {
        return $this->roles()->where('name', 'customer')->exists();
    }

    /** Website guests and other users without staff resort assignments. */
    public function isGuestAccount(): bool
    {
        if ($this->isAdmin()) {
            return false;
        }

        return $this->assignedResortIds() === [];
    }

    public function assignedResortIds(): array
    {
        return $this->resorts()->pluck('resorts.id')->map(fn ($id) => (int) $id)->all();
    }

    public function passwordResetOtps()
    {
        return $this->hasMany(PasswordResetOtp::class, 'email', 'email');
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    public function activityLogs()
    {
        return $this->hasMany(ActivityLog::class);
    }
}
