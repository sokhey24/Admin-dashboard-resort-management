<?php

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

Route::get('/', function () {
    return ['laravel' => app()->version()];
});

Route::get('/auth/google', function () {
    return Socialite::driver('google')->redirect();
});

Route::get('/auth/google/callback', function () {
    $googleUser = Socialite::driver('google')->user();

    $user = User::updateOrCreate(
        ['email' => $googleUser->email],
        [
            'name'              => $googleUser->name,
            'email'             => $googleUser->email,
            'password'          => Str::password(12),
            'email_verified_at' => now(),
        ]
    );

    Auth::login($user);

    return redirect(config('app.frontend_url') . '/dashboard');
});
