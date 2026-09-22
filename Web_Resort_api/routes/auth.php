<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\Auth\PasswordController;
use App\Http\Controllers\Api\Auth\ForgotPasswordController;
use App\Http\Controllers\Api\Profile\ProfileController;

// Public routes
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'store']);
    Route::post('/login',    [AuthController::class, 'login'])->middleware('throttle:10,1');
    Route::post('/two-factor/challenge', [AuthController::class, 'twoFactorChallenge'])->middleware('throttle:5,1');

    Route::post('/forgot-password/send-otp',   [ForgotPasswordController::class, 'sendOtp']);
    Route::post('/forgot-password/verify-otp', [ForgotPasswordController::class, 'verifyOtp']);
    Route::post('/forgot-password/resend-otp', [ForgotPasswordController::class, 'resendOtp']);
    Route::post('/forgot-password/reset',      [ForgotPasswordController::class, 'resetPassword']);
});

// Protected routes
Route::middleware('auth:sanctum')->prefix('auth')->group(function () {
    Route::post('/logout',          [AuthController::class, 'logout']);
    Route::get('/me',               [AuthController::class, 'me']);
    Route::post('/profile',         [AuthController::class, 'update']);
    Route::post('/change-password', [PasswordController::class, 'change']);
});

// ── Profile Management Routes (Enhanced) ──────────────────────────────────────
Route::middleware('auth:sanctum')->prefix('profile')->group(function () {
    // Profile Information
    Route::get('/',              [ProfileController::class, 'show']);
    Route::put('/',              [ProfileController::class, 'update']);
    Route::post('/update',       [ProfileController::class, 'update']); // For FormData support
    
    // Avatar Management
    Route::post('/avatar',       [ProfileController::class, 'uploadAvatar']);
    Route::delete('/avatar',     [ProfileController::class, 'deleteAvatar']);
    
    // Security
    Route::post('/change-password', [ProfileController::class, 'changePassword'])->middleware('throttle:5,1');
    Route::get('/two-factor',            [ProfileController::class, 'twoFactorStatus']);
    Route::post('/two-factor/setup',     [ProfileController::class, 'twoFactorSetup'])->middleware('throttle:5,1');
    Route::post('/two-factor/confirm',   [ProfileController::class, 'twoFactorConfirm'])->middleware('throttle:5,1');
    Route::post('/two-factor/disable',   [ProfileController::class, 'twoFactorDisable'])->middleware('throttle:5,1');
    
    // Session Management
    Route::get('/sessions',                      [ProfileController::class, 'sessions']);
    Route::delete('/sessions/{tokenId}',         [ProfileController::class, 'revokeSession']);
    Route::post('/sessions/revoke-all-others',   [ProfileController::class, 'revokeAllOtherSessions']);
    
    // Activity & History
    Route::get('/activity',      [ProfileController::class, 'activityHistory']);
    Route::get('/statistics',    [ProfileController::class, 'statistics']);
    
    // Preferences
    Route::get('/preferences',   [ProfileController::class, 'getPreferences']);
    Route::put('/preferences',   [ProfileController::class, 'updatePreferences']);
});
