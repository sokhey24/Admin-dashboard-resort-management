<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Website\WebsiteContentController;
use App\Http\Controllers\Api\Payment\StripeWebhookController;

// Public — resort website reads CMS content without auth
Route::get('website-content', [WebsiteContentController::class, 'index']);

Route::post('stripe/webhook', [StripeWebhookController::class, 'handle']);

require __DIR__ . '/auth.php';
require __DIR__ . '/admin.php';
require __DIR__ . '/customer.php';
