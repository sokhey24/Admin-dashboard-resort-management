<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Operational timezone
    |--------------------------------------------------------------------------
    | Night-audit dates (arrivals, departures, occupancy) use this timezone.
    | Set NIGHT_AUDIT_TIMEZONE in .env (e.g. Asia/Phnom_Penh).
    */
    'timezone' => env('NIGHT_AUDIT_TIMEZONE', env('APP_TIMEZONE', 'UTC')),

    /*
    |--------------------------------------------------------------------------
    | Scheduler
    |--------------------------------------------------------------------------
    | Laravel only runs scheduled tasks when `php artisan schedule:run` is invoked
    | every minute (cron on Linux, Task Scheduler on Windows, or your PaaS scheduler).
    */
    'schedule_time' => env('NIGHT_AUDIT_SCHEDULE_TIME', '00:05'),

    /*
    |--------------------------------------------------------------------------
    | Default operational date when --date is omitted
    |--------------------------------------------------------------------------
    | "previous" = yesterday in operational timezone (typical close-of-business).
    */
    'default_operational_date' => env('NIGHT_AUDIT_DEFAULT_DATE', 'previous'),

    'currency' => env('NIGHT_AUDIT_CURRENCY', 'USD'),

    /*
    |--------------------------------------------------------------------------
    | No-show policy (status only — no automatic penalties unless enabled)
    |--------------------------------------------------------------------------
    | Penalties are NOT applied unless no_show_penalty_enabled is true AND
    | no_show_penalty_nights > 0 (charges existing balance rules only).
    */
    'no_show_enabled' => (bool) env('NIGHT_AUDIT_NO_SHOW_ENABLED', true),

    'no_show_penalty_enabled' => (bool) env('NIGHT_AUDIT_NO_SHOW_PENALTY_ENABLED', false),

    'no_show_penalty_nights' => (int) env('NIGHT_AUDIT_NO_SHOW_PENALTY_NIGHTS', 0),

    'system_user_id' => env('NIGHT_AUDIT_SYSTEM_USER_ID'),

];
