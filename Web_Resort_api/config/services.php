<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'google' => [
        'client_id'     => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect'      => env('GOOGLE_REDIRECT'),
    ],

    'bakong' => [
        'token' => env('BAKONG_TOKEN'),
        'account_id' => env('BAKONG_ACCOUNT_ID', 'sokhey_van@bkrt'),
        'merchant_name' => env('BAKONG_MERCHANT_NAME', 'Solara Resort'),
        'merchant_city' => env('BAKONG_MERCHANT_CITY', 'Phnom Penh'),
        'currency' => env('BAKONG_CURRENCY', 'USD'),
        'use_sandbox' => (bool) env('BAKONG_USE_SANDBOX', false),
        'qr_ttl_seconds' => (int) env('BAKONG_QR_TTL_SECONDS', 300),
        // Keep polling Bakong after the QR TTL so late settlements are not marked expired too soon.
        'verify_grace_seconds' => (int) env('BAKONG_VERIFY_GRACE_SECONDS', 180),
    ],

];
