<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Dashboard\DashboardController;
use App\Http\Controllers\Api\User\UserController;
use App\Http\Controllers\Api\User\RoleController;
use App\Http\Controllers\Api\User\PermissionController;
use App\Http\Controllers\Api\User\UserPermissionController;
use App\Http\Controllers\Api\Resort\ResortController;
use App\Http\Controllers\Api\Resort\BranchController;
use App\Http\Controllers\Api\Resort\FacilityController;
use App\Http\Controllers\Api\Resort\GalleryController;
use App\Http\Controllers\Api\Room\RoomTypeController;
use App\Http\Controllers\Api\Room\RoomController;
use App\Http\Controllers\Api\Room\RoomImageController;
use App\Http\Controllers\Api\Booking\BookingController;
use App\Http\Controllers\Api\Booking\BookingRoomController;
use App\Http\Controllers\Api\Booking\BookingStatusController;
use App\Http\Controllers\Api\Payment\PaymentController;
use App\Http\Controllers\Api\Payment\InvoiceController;
use App\Http\Controllers\Api\Payment\TransactionController;
use App\Http\Controllers\Api\Restaurant\RestaurantController;
use App\Http\Controllers\Api\Restaurant\FoodCategoryController;
use App\Http\Controllers\Api\Restaurant\MenuItemController;
use App\Http\Controllers\Api\Restaurant\RestaurantTableController;
use App\Http\Controllers\Api\Restaurant\TableReservationController;
use App\Http\Controllers\Api\Restaurant\FoodOrderController;
use App\Http\Controllers\Api\Restaurant\RestaurantBillController;
use App\Http\Controllers\Api\Guest\GuestController;
use App\Http\Controllers\Api\Review\ReviewController;
use App\Http\Controllers\Api\Staff\ResortStaffController;
use App\Http\Controllers\Api\Staff\RestaurantStaffController;
use App\Http\Controllers\Api\Resort\ResortDashboardController;
use App\Http\Controllers\Api\Restaurant\RestaurantDashboardController;
use App\Http\Controllers\Api\Website\WebsiteContentController;

Route::middleware('auth:sanctum')->prefix('admin')->group(function () {

    // Dashboard — admin.dashboard.view
    Route::get('/dashboard', [DashboardController::class, 'index'])
        ->middleware('permission:admin.dashboard.view');

    // Users — admin.users.*
    Route::get('users',           [UserController::class, 'index'])  ->middleware('permission:admin.users.view');
    Route::post('users',          [UserController::class, 'store'])  ->middleware('permission:admin.users.create');
    Route::get('users/{user}',    [UserController::class, 'show'])   ->middleware('permission:admin.users.view');
    Route::put('users/{user}',    [UserController::class, 'update']) ->middleware('permission:admin.users.update');
    Route::patch('users/{user}',  [UserController::class, 'update']) ->middleware('permission:admin.users.update');
    Route::delete('users/{user}', [UserController::class, 'destroy'])->middleware('permission:admin.users.delete');

    // Roles — admin.roles.*
    Route::get('roles',           [RoleController::class, 'index'])  ->middleware('permission:admin.roles.view');
    Route::post('roles',          [RoleController::class, 'store'])  ->middleware('permission:admin.roles.create');
    Route::put('roles/{role}',    [RoleController::class, 'update']) ->middleware('permission:admin.roles.update');
    Route::patch('roles/{role}',  [RoleController::class, 'update']) ->middleware('permission:admin.roles.update');
    Route::delete('roles/{role}', [RoleController::class, 'destroy'])->middleware('permission:admin.roles.delete');

    // Permissions — admin.permissions.*
    Route::get('permissions',                [PermissionController::class, 'index'])  ->middleware('permission:admin.permissions.view');
    Route::post('permissions',               [PermissionController::class, 'store'])  ->middleware('permission:admin.permissions.create');
    Route::delete('permissions/{permission}',[PermissionController::class, 'destroy'])->middleware('permission:admin.permissions.delete');

    // Role-Permission assignment — admin.roles.update
    Route::post('roles/{role}/permissions',  [RoleController::class, 'assignPermissions']) ->middleware('permission:admin.roles.update');
    Route::delete('roles/{role}/permissions',[RoleController::class, 'revokePermissions']) ->middleware('permission:admin.roles.update');

    // User-Role assignment — admin.users.update
    Route::post('users/{user}/roles',        [UserController::class, 'assignRole'])   ->middleware('permission:admin.users.update');

    // User Permission management — view/update per-user overrides
    Route::get('users/{user}/permissions',   [UserPermissionController::class, 'show'])       ->middleware('permission:admin.permissions.view');
    Route::put('users/{user}/permissions',   [UserPermissionController::class, 'update'])     ->middleware('permission:admin.permissions.update');
    Route::put('users/{user}/role',          [UserPermissionController::class, 'updateRole']) ->middleware('permission:admin.roles.update');

    // Resorts — admin.resorts.*
    Route::get('resorts',            [ResortController::class, 'index'])  ->middleware('permission:admin.resorts.view,resort.dashboard.view,resort.rooms.view,resort.branches.view');
    Route::post('resorts',           [ResortController::class, 'store'])  ->middleware('permission:admin.resorts.create');
    Route::get('resorts/{resort}',   [ResortController::class, 'show'])   ->middleware('permission:admin.resorts.view');
    Route::put('resorts/{resort}',   [ResortController::class, 'update']) ->middleware('permission:admin.resorts.update');
    Route::patch('resorts/{resort}', [ResortController::class, 'update']) ->middleware('permission:admin.resorts.update');
    Route::delete('resorts/{resort}',[ResortController::class, 'destroy'])->middleware('permission:admin.resorts.delete');

    // Branches, Facilities, Gallery — admin.resorts.*
    Route::get('branches',           [BranchController::class,   'index'])  ->middleware('permission:admin.resorts.view,resort.dashboard.view,resort.rooms.view,resort.branches.view');
    Route::post('branches',          [BranchController::class,   'store'])  ->middleware('permission:admin.resorts.create');
    Route::get('branches/{branch}',  [BranchController::class,   'show'])   ->middleware('permission:admin.resorts.view');
    Route::put('branches/{branch}',  [BranchController::class,   'update']) ->middleware('permission:admin.resorts.update');
    Route::patch('branches/{branch}',[BranchController::class,   'update']) ->middleware('permission:admin.resorts.update');
    Route::delete('branches/{branch}',[BranchController::class,  'destroy'])->middleware('permission:admin.resorts.delete');

    Route::get('facilities',              [FacilityController::class, 'index'])  ->middleware('permission:admin.resorts.view');
    Route::post('facilities',             [FacilityController::class, 'store'])  ->middleware('permission:admin.resorts.create');
    Route::get('facilities/{facility}',   [FacilityController::class, 'show'])   ->middleware('permission:admin.resorts.view');
    Route::put('facilities/{facility}',   [FacilityController::class, 'update']) ->middleware('permission:admin.resorts.update');
    Route::patch('facilities/{facility}', [FacilityController::class, 'update']) ->middleware('permission:admin.resorts.update');
    Route::delete('facilities/{facility}',[FacilityController::class, 'destroy'])->middleware('permission:admin.resorts.delete');

    Route::get('gallery',            [GalleryController::class, 'index'])  ->middleware('permission:admin.resorts.view');
    Route::post('gallery',           [GalleryController::class, 'store'])  ->middleware('permission:admin.resorts.create');
    Route::get('gallery/{gallery}',  [GalleryController::class, 'show'])   ->middleware('permission:admin.resorts.view');
    Route::put('gallery/{gallery}',  [GalleryController::class, 'update']) ->middleware('permission:admin.resorts.update');
    Route::patch('gallery/{gallery}',[GalleryController::class, 'update']) ->middleware('permission:admin.resorts.update');
    Route::delete('gallery/{gallery}',[GalleryController::class,'destroy'])->middleware('permission:admin.resorts.delete');

    // Rooms — admin.resorts.*
    Route::get('room-types',               [RoomTypeController::class, 'index'])  ->middleware('permission:admin.resorts.view,resort.rooms.view');
    Route::post('room-types',              [RoomTypeController::class, 'store'])  ->middleware('permission:admin.resorts.create,resort.rooms.create');
    Route::get('room-types/{room_type}',   [RoomTypeController::class, 'show'])   ->middleware('permission:admin.resorts.view,resort.rooms.view');
    Route::put('room-types/{room_type}',   [RoomTypeController::class, 'update']) ->middleware('permission:admin.resorts.update,resort.rooms.update');
    Route::patch('room-types/{room_type}', [RoomTypeController::class, 'update']) ->middleware('permission:admin.resorts.update,resort.rooms.update');
    Route::delete('room-types/{room_type}',[RoomTypeController::class, 'destroy'])->middleware('permission:admin.resorts.delete,resort.rooms.delete');

    Route::get('rooms',          [RoomController::class, 'index'])  ->middleware('permission:admin.resorts.view,resort.rooms.view');
    Route::post('rooms',         [RoomController::class, 'store'])  ->middleware('permission:admin.resorts.create,resort.rooms.create');
    Route::get('rooms/{room}',   [RoomController::class, 'show'])   ->middleware('permission:admin.resorts.view,resort.rooms.view');
    Route::put('rooms/{room}',   [RoomController::class, 'update']) ->middleware('permission:admin.resorts.update,resort.rooms.update');
    Route::patch('rooms/{room}', [RoomController::class, 'update']) ->middleware('permission:admin.resorts.update,resort.rooms.update');
    Route::delete('rooms/{room}',[RoomController::class, 'destroy'])->middleware('permission:admin.resorts.delete,resort.rooms.delete');

    Route::get('room-images',               [RoomImageController::class, 'index'])  ->middleware('permission:admin.resorts.view,resort.rooms.view');
    Route::post('room-images',              [RoomImageController::class, 'store'])  ->middleware('permission:admin.resorts.create,resort.rooms.create,resort.rooms.update');
    Route::get('room-images/{room_image}',  [RoomImageController::class, 'show'])   ->middleware('permission:admin.resorts.view,resort.rooms.view');
    Route::put('room-images/{room_image}',  [RoomImageController::class, 'update']) ->middleware('permission:admin.resorts.update,resort.rooms.update');
    Route::patch('room-images/{room_image}',[RoomImageController::class, 'update']) ->middleware('permission:admin.resorts.update,resort.rooms.update');
    Route::delete('room-images/{room_image}',[RoomImageController::class,'destroy'])->middleware('permission:admin.resorts.delete,resort.rooms.delete,resort.rooms.update');

    // Bookings — admin.resorts.* or resort.bookings.* / check-in / check-out
    Route::get('bookings',           [BookingController::class, 'index'])  ->middleware('permission:admin.resorts.view,resort.bookings.view,resort.checkin.manage,resort.checkout.manage');
    Route::post('bookings',          [BookingController::class, 'store'])  ->middleware('permission:admin.resorts.create,resort.bookings.create');
    Route::get('bookings/{booking}', [BookingController::class, 'show'])   ->middleware('permission:admin.resorts.view,resort.bookings.view,resort.checkin.manage,resort.checkout.manage');
    Route::put('bookings/{booking}', [BookingController::class, 'update']) ->middleware('permission:admin.resorts.update,resort.bookings.update,resort.checkin.manage,resort.checkout.manage');
    Route::patch('bookings/{booking}',[BookingController::class,'update']) ->middleware('permission:admin.resorts.update,resort.bookings.update,resort.checkin.manage,resort.checkout.manage');
    Route::delete('bookings/{booking}',[BookingController::class,'destroy'])->middleware('permission:admin.resorts.delete,resort.bookings.delete');

    Route::get('booking-rooms',                [BookingRoomController::class, 'index'])  ->middleware('permission:admin.resorts.view,resort.bookings.view');
    Route::post('booking-rooms',               [BookingRoomController::class, 'store'])  ->middleware('permission:admin.resorts.create,resort.bookings.create');
    Route::get('booking-rooms/{booking_room}', [BookingRoomController::class, 'show'])   ->middleware('permission:admin.resorts.view,resort.bookings.view');
    Route::put('booking-rooms/{booking_room}', [BookingRoomController::class, 'update']) ->middleware('permission:admin.resorts.update,resort.bookings.update');
    Route::delete('booking-rooms/{booking_room}',[BookingRoomController::class,'destroy'])->middleware('permission:admin.resorts.delete,resort.bookings.delete');

    Route::get('bookings/{booking}/status', [BookingStatusController::class, 'index']) ->middleware('permission:admin.resorts.view,resort.bookings.view');
    Route::put('bookings/{booking}/status', [BookingStatusController::class, 'update'])->middleware('permission:admin.resorts.update,resort.bookings.update,resort.checkin.manage,resort.checkout.manage');

    // Payments — admin.reports.* + payments.*
    Route::get('payments',           [PaymentController::class, 'index'])  ->middleware('permission:payments.view,admin.reports.view,resort.payments.view,restaurant.billing.view');
    Route::post('payments',          [PaymentController::class, 'store'])  ->middleware('permission:payments.view,admin.reports.view,resort.payments.create');
    Route::get('payments/{payment}', [PaymentController::class, 'show'])   ->middleware('permission:payments.view,resort.payments.view,restaurant.billing.view');
    Route::put('payments/{payment}', [PaymentController::class, 'update']) ->middleware('permission:admin.reports.view');
    Route::delete('payments/{payment}',[PaymentController::class,'destroy'])->middleware('permission:admin.reports.view');

    // Payment receipt & workflow actions
    Route::get('payments/{payment}/receipt',      [PaymentController::class, 'receipt'])     ->middleware('permission:payments.view');
    Route::get('payments/{payment}/receipt/pdf',  [PaymentController::class, 'receiptPdf'])  ->middleware('permission:payments.pdf');
    Route::post('payments/{payment}/print',       [PaymentController::class, 'printReceipt'])->middleware('permission:payments.print');
    Route::post('payments/{payment}/refund',      [PaymentController::class, 'refund'])      ->middleware('permission:payments.refund');

    Route::get('invoices',           [InvoiceController::class, 'index'])  ->middleware('permission:admin.reports.view,resort.invoices.view,resort.payments.view,payments.view');
    Route::post('invoices',          [InvoiceController::class, 'store'])  ->middleware('permission:admin.reports.view,resort.invoices.view,resort.payments.create');
    Route::get('invoices/{invoice}', [InvoiceController::class, 'show'])   ->middleware('permission:admin.reports.view,resort.invoices.view,resort.payments.view,payments.view');
    Route::put('invoices/{invoice}', [InvoiceController::class, 'update']) ->middleware('permission:admin.reports.view,resort.invoices.view');
    Route::delete('invoices/{invoice}',[InvoiceController::class,'destroy'])->middleware('permission:admin.reports.view');

    Route::get('transactions',                [TransactionController::class, 'index'])  ->middleware('permission:admin.reports.view');
    Route::post('transactions',               [TransactionController::class, 'store'])  ->middleware('permission:admin.reports.view');
    Route::get('transactions/{transaction}',  [TransactionController::class, 'show'])   ->middleware('permission:admin.reports.view');
    Route::put('transactions/{transaction}',  [TransactionController::class, 'update']) ->middleware('permission:admin.reports.view');
    Route::delete('transactions/{transaction}',[TransactionController::class,'destroy'])->middleware('permission:admin.reports.view');

    // Restaurants — admin.restaurand.*
    Route::get('restaurants',                [RestaurantController::class, 'index'])  ->middleware('permission:admin.restaurand.view,restaurant.dashboard.view,restaurant.menu.view,restaurant.tables.view');
    Route::post('restaurants',               [RestaurantController::class, 'store'])  ->middleware('permission:admin.restaurand.create');
    Route::get('restaurants/{restaurant}',   [RestaurantController::class, 'show'])   ->middleware('permission:admin.restaurand.view,restaurant.dashboard.view');
    Route::put('restaurants/{restaurant}',   [RestaurantController::class, 'update']) ->middleware('permission:admin.restaurand.update');
    Route::patch('restaurants/{restaurant}', [RestaurantController::class, 'update']) ->middleware('permission:admin.restaurand.update');
    Route::delete('restaurants/{restaurant}',[RestaurantController::class, 'destroy'])->middleware('permission:admin.restaurand.delete');

    // Restaurant sub-resources — admin.restaurand.* or restaurant manager domain perms
    Route::get('food-categories',                   [FoodCategoryController::class, 'index'])  ->middleware('permission:admin.restaurand.view,restaurant.categories.view,restaurant.menu.view');
    Route::post('food-categories',                  [FoodCategoryController::class, 'store'])  ->middleware('permission:admin.restaurand.create,restaurant.categories.manage');
    Route::get('food-categories/{food_category}',   [FoodCategoryController::class, 'show'])   ->middleware('permission:admin.restaurand.view,restaurant.categories.view,restaurant.menu.view');
    Route::put('food-categories/{food_category}',   [FoodCategoryController::class, 'update']) ->middleware('permission:admin.restaurand.update,restaurant.categories.manage');
    Route::patch('food-categories/{food_category}', [FoodCategoryController::class, 'update']) ->middleware('permission:admin.restaurand.update,restaurant.categories.manage');
    Route::delete('food-categories/{food_category}',[FoodCategoryController::class, 'destroy'])->middleware('permission:admin.restaurand.delete,restaurant.categories.manage');

    Route::get('menu-items',               [MenuItemController::class, 'index'])  ->middleware('permission:admin.restaurand.view,restaurant.menu.view');
    Route::post('menu-items',              [MenuItemController::class, 'store'])  ->middleware('permission:admin.restaurand.create,restaurant.menu.manage');
    Route::get('menu-items/{menu_item}',   [MenuItemController::class, 'show'])   ->middleware('permission:admin.restaurand.view,restaurant.menu.view');
    Route::put('menu-items/{menu_item}',   [MenuItemController::class, 'update']) ->middleware('permission:admin.restaurand.update,restaurant.menu.manage');
    Route::patch('menu-items/{menu_item}', [MenuItemController::class, 'update']) ->middleware('permission:admin.restaurand.update,restaurant.menu.manage');
    Route::delete('menu-items/{menu_item}',[MenuItemController::class, 'destroy'])->middleware('permission:admin.restaurand.delete,restaurant.menu.manage');

    Route::get('restaurant-tables',                  [RestaurantTableController::class, 'index'])  ->middleware('permission:admin.restaurand.view,restaurant.tables.view');
    Route::post('restaurant-tables',                 [RestaurantTableController::class, 'store'])  ->middleware('permission:admin.restaurand.create,restaurant.tables.manage');
    Route::get('restaurant-tables/{restaurant_table}',[RestaurantTableController::class,'show'])   ->middleware('permission:admin.restaurand.view,restaurant.tables.view');
    Route::put('restaurant-tables/{restaurant_table}',[RestaurantTableController::class,'update']) ->middleware('permission:admin.restaurand.update,restaurant.tables.manage');
    Route::patch('restaurant-tables/{restaurant_table}',[RestaurantTableController::class,'update'])->middleware('permission:admin.restaurand.update,restaurant.tables.manage');
    Route::delete('restaurant-tables/{restaurant_table}',[RestaurantTableController::class,'destroy'])->middleware('permission:admin.restaurand.delete,restaurant.tables.manage');

    Route::get('table-reservations',                    [TableReservationController::class, 'index'])  ->middleware('permission:admin.restaurand.view,restaurant.reservations.view');
    Route::post('table-reservations',                   [TableReservationController::class, 'store'])  ->middleware('permission:admin.restaurand.create,restaurant.reservations.manage');
    Route::get('table-reservations/{table_reservation}', [TableReservationController::class,'show'])   ->middleware('permission:admin.restaurand.view,restaurant.reservations.view');
    Route::put('table-reservations/{table_reservation}', [TableReservationController::class,'update']) ->middleware('permission:admin.restaurand.update,restaurant.reservations.manage');
    Route::patch('table-reservations/{table_reservation}',[TableReservationController::class,'update'])->middleware('permission:admin.restaurand.update,restaurant.reservations.manage');
    Route::delete('table-reservations/{table_reservation}',[TableReservationController::class,'destroy'])->middleware('permission:admin.restaurand.delete,restaurant.reservations.manage');

    Route::get('food-orders',              [FoodOrderController::class, 'index'])  ->middleware('permission:admin.restaurand.view,restaurant.orders.view');
    Route::post('food-orders',             [FoodOrderController::class, 'store'])  ->middleware('permission:admin.restaurand.create,restaurant.orders.create');
    Route::get('food-orders/{food_order}', [FoodOrderController::class, 'show'])   ->middleware('permission:admin.restaurand.view,restaurant.orders.view');
    Route::put('food-orders/{food_order}', [FoodOrderController::class, 'update']) ->middleware('permission:admin.restaurand.update,restaurant.orders.update');
    Route::patch('food-orders/{food_order}',[FoodOrderController::class,'update']) ->middleware('permission:admin.restaurand.update,restaurant.orders.update');
    Route::delete('food-orders/{food_order}',[FoodOrderController::class,'destroy'])->middleware('permission:admin.restaurand.delete,restaurant.orders.delete');

    Route::get('restaurant-bills',                  [RestaurantBillController::class, 'index'])  ->middleware('permission:admin.restaurand.view,restaurant.billing.view');
    Route::post('restaurant-bills',                 [RestaurantBillController::class, 'store'])  ->middleware('permission:admin.restaurand.create,restaurant.billing.manage');
    Route::get('restaurant-bills/{restaurant_bill}', [RestaurantBillController::class,'show'])   ->middleware('permission:admin.restaurand.view,restaurant.billing.view');
    Route::put('restaurant-bills/{restaurant_bill}', [RestaurantBillController::class,'update']) ->middleware('permission:admin.restaurand.update,restaurant.billing.manage');
    Route::patch('restaurant-bills/{restaurant_bill}',[RestaurantBillController::class,'update'])->middleware('permission:admin.restaurand.update,restaurant.billing.manage');
    Route::delete('restaurant-bills/{restaurant_bill}',[RestaurantBillController::class,'destroy'])->middleware('permission:admin.restaurand.delete,restaurant.billing.manage');

    // Website Content CMS
    Route::get('website-content',                              [WebsiteContentController::class, 'index'])      ->middleware('permission:admin.resorts.view');
    Route::post('website-content',                             [WebsiteContentController::class, 'upsert'])     ->middleware('permission:admin.resorts.update');
    Route::delete('website-content/{websiteContent}/image',    [WebsiteContentController::class, 'deleteImage'])->middleware('permission:admin.resorts.update');

    // Guests & Reviews
    Route::get('guests',          [GuestController::class, 'index'])  ->middleware('permission:admin.users.view,resort.guests.view,resort.bookings.view,resort.bookings.create');
    Route::post('guests',         [GuestController::class, 'store'])  ->middleware('permission:admin.users.create,resort.guests.create');
    Route::get('guests/{guest}',  [GuestController::class, 'show'])   ->middleware('permission:admin.users.view,resort.guests.view');
    Route::put('guests/{guest}',  [GuestController::class, 'update']) ->middleware('permission:admin.users.update,resort.guests.update');
    Route::patch('guests/{guest}',[GuestController::class, 'update']) ->middleware('permission:admin.users.update,resort.guests.update');
    Route::delete('guests/{guest}',[GuestController::class,'destroy'])->middleware('permission:admin.users.delete');

    Route::get('reviews',           [ReviewController::class, 'index'])  ->middleware('permission:admin.resorts.view,resort.dashboard.view,resort.rooms.view');
    Route::post('reviews',          [ReviewController::class, 'store'])  ->middleware('permission:admin.resorts.create');
    Route::get('reviews/{review}',  [ReviewController::class, 'show'])   ->middleware('permission:admin.resorts.view,resort.dashboard.view,resort.rooms.view');
    Route::put('reviews/{review}',  [ReviewController::class, 'update']) ->middleware('permission:admin.resorts.update');
    Route::patch('reviews/{review}',[ReviewController::class, 'update']) ->middleware('permission:admin.resorts.update');
    Route::delete('reviews/{review}',[ReviewController::class,'destroy'])->middleware('permission:admin.resorts.delete');
});

// Resort routes
Route::middleware('auth:sanctum')->prefix('resort')->group(function () {
    Route::get('dashboard', [ResortDashboardController::class, 'index'])->middleware('permission:resort.dashboard.view');
    Route::get('staff',           [ResortStaffController::class, 'index'])  ->middleware('permission:resort.staff.view');
    Route::post('staff',          [ResortStaffController::class, 'store'])  ->middleware('permission:resort.staff.create');
    Route::get('staff/{user}',    [ResortStaffController::class, 'show'])   ->middleware('permission:resort.staff.view');
    Route::put('staff/{user}',    [ResortStaffController::class, 'update']) ->middleware('permission:resort.staff.update');
    Route::patch('staff/{user}',  [ResortStaffController::class, 'update']) ->middleware('permission:resort.staff.update');
    Route::delete('staff/{user}', [ResortStaffController::class, 'destroy'])->middleware('permission:resort.staff.delete');
});

// Restaurant routes
Route::middleware('auth:sanctum')->prefix('restaurant')->group(function () {
    Route::get('dashboard', [RestaurantDashboardController::class, 'index'])->middleware('permission:restaurant.dashboard.view');
    Route::get('staff',           [RestaurantStaffController::class, 'index'])  ->middleware('permission:restaurant.staff.view');
    Route::post('staff',          [RestaurantStaffController::class, 'store'])  ->middleware('permission:restaurant.staff.create');
    Route::get('staff/{user}',    [RestaurantStaffController::class, 'show'])   ->middleware('permission:restaurant.staff.view');
    Route::put('staff/{user}',    [RestaurantStaffController::class, 'update']) ->middleware('permission:restaurant.staff.update');
    Route::patch('staff/{user}',  [RestaurantStaffController::class, 'update']) ->middleware('permission:restaurant.staff.update');
    Route::delete('staff/{user}', [RestaurantStaffController::class, 'destroy'])->middleware('permission:restaurant.staff.delete');
});
