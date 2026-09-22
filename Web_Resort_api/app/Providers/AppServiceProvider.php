<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Http\Request;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        // Allow _method spoofing (PUT/PATCH) in multipart/form-data on API routes
        Request::enableHttpMethodParameterOverride();
    }
}
