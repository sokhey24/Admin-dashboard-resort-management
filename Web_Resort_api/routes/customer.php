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
use App\Http\Controllers\Api\Booking\GuestFolioController;
use App\Http\Controllers\Api\Booking\GuestBookingRescheduleController;
use App\Http\Controllers\Api\Payment\PaymentController;
use App\Http\Controllers\Api\Payment\KhqrPaymentController;
use App\Http\Controllers\Api\Payment\StripePaymentController;
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
use App\Http\Controllers\Api\Customer\ContactInquiryController;
use App\Http\Controllers\Api\Notification\UserNotificationController;

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
    Route::get('/menu-items/{menu_item}', [MenuItemController::class, 'show']);
    Route::get('/food-categories', [FoodCategoryController::class, 'index']);
    Route::get('/food-categories/{food_category}', [FoodCategoryController::class, 'show']);
    Route::get('/reviews',    [ReviewController::class, 'index']);

    // Authoritative price + availability pre-check. Public because the guest site
    // quotes before sign-in; throttled because it is an unauthenticated read.
    Route::post('/booking/quote', [BookingQuoteController::class, 'store'])
        ->middleware('throttle:60,1');

    Route::post('/activity-bookings', [ActivityBookingController::class, 'store'])
        ->middleware(['optional.sanctum', 'throttle:30,1']);

    Route::post('/service-inquiries', [ServiceInquiryController::class, 'store'])
        ->middleware(['optional.sanctum', 'throttle:30,1']);

    Route::post('/contact-inquiries', [ContactInquiryController::class, 'store'])
        ->middleware(['optional.sanctum', 'throttle:30,1']);

    Route::post('/table-reservation-requests', [GuestTableReservationController::class, 'store'])
        ->middleware(['optional.sanctum', 'throttle:30,1']);
});

// Authenticated customer routes
Route::middleware('auth:sanctum')->prefix('customer')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index']);

    Route::get('notifications', [UserNotificationController::class, 'index']);
    Route::patch('notifications/{notification}/read', [UserNotificationController::class, 'markRead']);
    Route::post('notifications/read-all', [UserNotificationController::class, 'markAllRead']);

    // Bookings
    Route::apiResource('bookings', BookingController::class);
    Route::get('bookings/{booking}/status', [BookingStatusController::class, 'index']);
    Route::get('bookings/{booking}/folio', [GuestFolioController::class, 'show']);
    Route::get('bookings/{booking}/folio/pdf', [GuestFolioController::class, 'invoicePdf']);
    Route::post('bookings/{booking}/reschedule/quote', [GuestBookingRescheduleController::class, 'quote']);
    Route::post('bookings/{booking}/reschedule', [GuestBookingRescheduleController::class, 'apply']);

    // Payments & Invoices
    Route::apiResource('payments', PaymentController::class);
    Route::post('bookings/{booking}/khqr', [KhqrPaymentController::class, 'store']);
    Route::post('bookings/{booking}/stripe/payment-intent', [StripePaymentController::class, 'storeIntent']);
    Route::post('payments/{payment}/stripe/sync', [StripePaymentController::class, 'sync']);
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
