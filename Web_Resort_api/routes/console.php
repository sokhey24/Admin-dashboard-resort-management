<?php

use App\Models\PasswordResetOtp;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Clean up expired/used OTP records older than 24 hours
Schedule::call(function () {
    PasswordResetOtp::where(function ($q) {
        $q->where('used', true)
          ->orWhere('expires_at', '<', now()->subHours(24));
    })->delete();
})->hourly()->name('cleanup-expired-otps')->withoutOverlapping();

/*
| Night audit — operational close (default 00:05 in NIGHT_AUDIT_TIMEZONE).
| Requires a system cron: * * * * * php /path/to/artisan schedule:run
*/
Schedule::command('resort:night-audit')
    ->dailyAt(config('night_audit.schedule_time', '00:05'))
    ->timezone(config('night_audit.timezone', 'UTC'))
    ->name('resort-night-audit')
    ->withoutOverlapping();
