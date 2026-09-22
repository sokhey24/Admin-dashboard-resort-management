<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\PaymentController;

Route::get('/', [ProductController::class, 'index'])->name('home');

Route::get('/product/{id}', [ProductController::class, 'show'])
    ->name('product.show');

Route::post('/checkout/{product}', [PaymentController::class, 'checkout'])
    ->name('checkout');

Route::post('/verify', [PaymentController::class, 'verifyTransaction'])
    ->name('verify.transaction');

Route::get('/payments/result', [PaymentController::class, 'paymentResult'])
    ->name('payments.result');
