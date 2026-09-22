<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Booking rate defaults
    |--------------------------------------------------------------------------
    |
    | Applied server-side to the discounted room subtotal. The guest site is
    | never allowed to supply tax or service charge; staff routes may override
    | them explicitly for manual adjustments.
    |
    */

    'tax_rate' => (float) env('PRICING_TAX_RATE', 0.10),

    'service_charge_rate' => (float) env('PRICING_SERVICE_CHARGE_RATE', 0.10),

    /*
    |--------------------------------------------------------------------------
    | Discount bounds
    |--------------------------------------------------------------------------
    */

    'max_discount_percent' => 100,

];
