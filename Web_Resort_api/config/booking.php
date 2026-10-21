<?php

return [

    'reschedule' => [
        'enabled' => (bool) env('BOOKING_RESCHEDULE_ENABLED', true),
        'eligible_statuses' => ['pending', 'confirmed'],
        'min_days_before_check_in' => (int) env('BOOKING_RESCHEDULE_MIN_DAYS_BEFORE', 0),
    ],

];
