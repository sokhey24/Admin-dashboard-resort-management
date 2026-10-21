<?php

namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ContactInquiryCreated
{
    use Dispatchable, SerializesModels;

    public function __construct(public readonly int $inquiryId) {}
}
