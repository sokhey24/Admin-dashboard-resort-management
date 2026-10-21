<?php

namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ActivityBookingCreated
{
    use Dispatchable, SerializesModels;

    public function __construct(public readonly int $activityBookingId) {}
}
