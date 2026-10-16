<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Dashboard\DashboardController;
use App\Http\Controllers\Api\Resort\ResortController;
use App\Http\Controllers\Api\Resort\BranchController;
use App\Http\Controllers\Api\Resort\FacilityController;
use App\Http\Controllers\Api\Resort\GalleryController;
use App\Http\Controllers\Api\Room\RoomController;
use App\Http\Controllers\Api\Room\RoomTypeController;
use App\Http\Controllers\Api\Booking\BookingController;
use App\Http\Controllers\Api\Booking\BookingQuoteController;
use App\Http\Controllers\Api\Booking\BookingStatusController;
use App\Http\Controllers\Api\Payment\PaymentController;
use App\Http\Controllers\Api\Payment\KhqrPaymentController;
use App\Http\Controllers\Api\Payment\InvoiceController;
use App\Http\Controllers\Api\Restaurant\MenuItemController;
use App\Http\Controllers\Api\Restaurant\FoodCategoryController;
use App\Http\Controllers\Api\Restaurant\RestaurantTableController;
use App\Http\Controllers\Api\Restaurant\TableReservationController;
use App\Http\Controllers\Api\Restaurant\GuestTableReservationController;
use App\Http\Controllers\Api\Restaurant\FoodOrderController;
use App\Http\Controllers\Api\Review\ReviewController;
use App\Http\Controllers\Api\Activity\ActivityBookingController;
use App\Http\Controllers\Api\Service\ServiceInquiryController;

// Public browsing routes (no auth required)
Route::prefix('customer')->group(function () {
    Route::get('/resorts',    [ResortController::class, 'index']);
    Route::get('/resorts/{resort}', [ResortController::class, 'show']);
    Route::get('/branches',   [BranchController::class, 'index']);
    Route::get('/branches/{branch}', [BranchController::class, 'show']);
    Route::get('/branches/{branch}/rooms', [BranchController::class, 'rooms']);
    Route::get('/facilities', [FacilityController::class, 'index']);
    Route::get('/gallery',    [GalleryController::class, 'index']);
    Route::get('/rooms',      [RoomController::class, 'index']);
    Route::get('/rooms/{room}', [RoomController::class, 'show']);
    Route::get('/room-types', [RoomTypeController::class, 'index']);
    Route::get('/menu-items', [MenuItemController::class, 'index']);
    Route::get('/food-categories', [FoodCategoryController::class, 'index']);
    Route::get('/reviews',    [ReviewController::class, 'index']);

    // Authoritative price + availability pre-check. Public because the guest site
    // quotes before sign-in; throttled because it is an unauthenticated read.
    Route::post('/booking/quote', [BookingQuoteController::class, 'store'])
        ->middleware('throttle:60,1');

    Route::post('/activity-bookings', [ActivityBookingController::class, 'store'])
        ->middleware(['optional.sanctum', 'throttle:30,1']);

    Route::post('/service-inquiries', [ServiceInquiryController::class, 'store'])
        ->middleware(['optional.sanctum', 'throttle:30,1']);

    Route::post('/table-reservation-requests', [GuestTableReservationController::class, 'store'])
        ->middleware(['optional.sanctum', 'throttle:30,1']);
});

// Authenticated customer routes
Route::middleware('auth:sanctum')->prefix('customer')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Bookings
    Route::apiResource('bookings', BookingController::class);
    Route::get('bookings/{booking}/status', [BookingStatusController::class, 'index']);

    // Payments & Invoices
    Route::apiResource('payments', PaymentController::class);
    Route::post('bookings/{booking}/khqr', [KhqrPaymentController::class, 'store']);
    Route::post('khqr/verify', [KhqrPaymentController::class, 'verifyByMd5']);
    Route::post('payments/{payment}/khqr/verify', [KhqrPaymentController::class, 'verify']);
    Route::apiResource('invoices', InvoiceController::class);

    // Restaurant
    Route::apiResource('restaurant-tables',   RestaurantTableController::class);
    Route::apiResource('table-reservations',  TableReservationController::class);
    Route::apiResource('food-orders',         FoodOrderController::class);

    // Reviews
    Route::get('/reviews/mine', [ReviewController::class, 'mine']);
    Route::post('/reviews', [ReviewController::class, 'store']);
    Route::patch('/reviews/{review}', [ReviewController::class, 'updateCustomer']);
    Route::delete('/reviews/{review}', [ReviewController::class, 'destroy']);
});
