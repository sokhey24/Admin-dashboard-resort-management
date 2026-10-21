<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Dashboard\DashboardController;
use App\Http\Controllers\Api\User\UserController;
use App\Http\Controllers\Api\User\RoleController;
use App\Http\Controllers\Api\User\PermissionController;
use App\Http\Controllers\Api\User\UserPermissionController;
use App\Http\Controllers\Api\Resort\ResortProfileController;
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
use App\Http\Controllers\Api\Booking\GuestFolioController;
use App\Http\Controllers\Api\Payment\PaymentController;
use App\Http\Controllers\Api\Payment\KhqrPaymentController;
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
use App\Http\Controllers\Api\Admin\ReportController;
use App\Http\Controllers\Api\Admin\ActivityBookingAdminController;
use App\Http\Controllers\Api\Admin\ServiceInquiryAdminController;
use App\Http\Controllers\Api\Admin\ContactInquiryAdminController;
use App\Http\Controllers\Api\Notification\UserNotificationController;

Route::middleware('auth:sanctum')->prefix('admin')->group(function () {

    // Dashboard — admin role or admin.dashboard.view only
    Route::get('/dashboard', [DashboardController::class, 'index'])
        ->middleware('dashboard.access');

    Route::get('notifications', [UserNotificationController::class, 'index']);
    Route::patch('notifications/{notification}/read', [UserNotificationController::class, 'markRead']);
    Route::post('notifications/read-all', [UserNotificationController::class, 'markAllRead']);

    // Reports — admin.reports.view
    Route::prefix('reports')->middleware('reports.access')->group(function () {
        Route::get('/', [ReportController::class, 'index']);
        Route::get('/bookings', [ReportController::class, 'bookings']);
        Route::get('/revenue', [ReportController::class, 'revenue']);
        Route::get('/rooms', [ReportController::class, 'rooms']);
        Route::get('/guests', [ReportController::class, 'guests']);
        Route::get('/daily', [ReportController::class, 'daily']);
        Route::get('/export', [ReportController::class, 'exportCsv']);
        Route::get('/night-audits', [\App\Http\Controllers\Api\Admin\NightAuditController::class, 'index']);
        Route::post('/night-audits/run', [\App\Http\Controllers\Api\Admin\NightAuditController::class, 'run'])
            ->middleware('permission:admin.reports.view');
    });

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
    Route::put('users/{user}/branches',      [UserController::class, 'syncBranches'])->middleware('permission:admin.users.update');
    Route::patch('users/{user}/branches',    [UserController::class, 'syncBranches'])->middleware('permission:admin.users.update');

    // User Permission management — view/update per-user overrides
    Route::get('users/{user}/permissions',   [UserPermissionController::class, 'show'])       ->middleware('permission:admin.permissions.view');
    Route::put('users/{user}/permissions',   [UserPermissionController::class, 'update'])     ->middleware('permission:admin.permissions.update');
    Route::put('users/{user}/role',          [UserPermissionController::class, 'updateRole']) ->middleware('permission:admin.roles.update');

    // Single brand settings (Corporate Brand Configuration)
    Route::get('resort-settings', [ResortProfileController::class, 'show'])
        ->middleware('permission:admin.resorts.view,resort.dashboard.view,resort.branches.view');
    Route::put('resort-settings', [ResortProfileController::class, 'update'])
        ->middleware('permission:admin.resorts.update');
    Route::patch('resort-settings', [ResortProfileController::class, 'update'])
        ->middleware('permission:admin.resorts.update');

    // Backward-compatible alias for existing frontend calls to resort-profile
    Route::get('resort-profile', [ResortProfileController::class, 'show'])
        ->middleware('permission:admin.resorts.view,resort.dashboard.view,resort.branches.view');
    Route::put('resort-profile', [ResortProfileController::class, 'update'])
        ->middleware('permission:admin.resorts.update');
    Route::patch('resort-profile', [ResortProfileController::class, 'update'])
        ->middleware('permission:admin.resorts.update');
    Route::post('resort-profile', [ResortProfileController::class, 'update'])
        ->middleware('permission:admin.resorts.update');

    // Brand overview & catalog listing
    Route::get('resorts',            [ResortController::class, 'index'])  ->middleware('permission:admin.resorts.view,resort.dashboard.view,resort.rooms.view,resort.branches.view');
    Route::post('resorts',           [ResortController::class, 'store'])  ->middleware('permission:admin.resorts.create');
    Route::get('resorts/{resort}',   [ResortController::class, 'show'])   ->middleware('permission:admin.resorts.view');
    Route::put('resorts/{resort}',   [ResortController::class, 'update']) ->middleware('permission:admin.resorts.update');
    Route::patch('resorts/{resort}', [ResortController::class, 'update']) ->middleware('permission:admin.resorts.update');
    Route::delete('resorts/{resort}',[ResortController::class, 'destroy'])->middleware('permission:admin.resorts.delete');


    // Branches, Facilities, Gallery — admin.resorts.*
    Route::get('branches',           [BranchController::class,   'index'])  ->middleware('permission:admin.resorts.view,resort.dashboard.view,resort.rooms.view,resort.branches.view');
    Route::post('branches',          [BranchController::class,   'store'])  ->middleware('permission:admin.resorts.create');
    Route::get('branches/{branch}/rooms', [BranchController::class, 'rooms'])
        ->middleware('permission:admin.resorts.view,resort.dashboard.view,resort.rooms.view,resort.branches.view');
    Route::get('branches/{branch}',  [BranchController::class,   'show'])   ->middleware('permission:admin.resorts.view');
    Route::put('branches/{branch}',  [BranchController::class,   'update']) ->middleware('permission:admin.resorts.update');
    Route::patch('branches/{branch}',[BranchController::class,   'update']) ->middleware('permission:admin.resorts.update');
    Route::delete('branches/{branch}',[BranchController::class,  'destroy'])->middleware('permission:admin.resorts.delete');

    Route::get('facilities',              [FacilityController::class, 'index'])  ->middleware('permission:admin.resorts.view,resort.dashboard.view,resort.facilities.view');
    Route::post('facilities',             [FacilityController::class, 'store'])  ->middleware('permission:admin.resorts.create,resort.facilities.manage');
    Route::get('facilities/{facility}',   [FacilityController::class, 'show'])   ->middleware('permission:admin.resorts.view,resort.dashboard.view,resort.facilities.view');
    Route::put('facilities/{facility}',   [FacilityController::class, 'update']) ->middleware('permission:admin.resorts.update,resort.facilities.manage');
    Route::patch('facilities/{facility}', [FacilityController::class, 'update']) ->middleware('permission:admin.resorts.update,resort.facilities.manage');
    Route::delete('facilities/{facility}',[FacilityController::class, 'destroy'])->middleware('permission:admin.resorts.delete,resort.facilities.manage');

    Route::get('gallery',            [GalleryController::class, 'index'])  ->middleware('permission:admin.resorts.view,resort.dashboard.view,resort.facilities.view');
    Route::post('gallery',           [GalleryController::class, 'store'])  ->middleware('permission:admin.resorts.create,resort.facilities.manage');
    Route::delete('gallery/{gallery}',[GalleryController::class,'destroy'])->middleware('permission:admin.resorts.delete,resort.facilities.manage');

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

    Route::get('bookings/{booking}/folio', [GuestFolioController::class, 'show'])
        ->middleware('permission:admin.resorts.view,resort.bookings.view,resort.checkin.manage,resort.checkout.manage');
    Route::post('bookings/{booking}/folio/charges', [GuestFolioController::class, 'storeCharge'])
        ->middleware('permission:admin.resorts.update,resort.bookings.update,resort.checkin.manage');
    Route::post('bookings/{booking}/folio/settle', [GuestFolioController::class, 'settle'])
        ->middleware('permission:admin.resorts.update,resort.bookings.update,resort.checkout.manage');
    Route::get('bookings/{booking}/folio/pdf', [GuestFolioController::class, 'invoicePdf'])
        ->middleware('permission:payments.pdf,resort.invoices.view,resort.bookings.view');
    Route::post('folio-charges/{folio_charge}/void', [GuestFolioController::class, 'voidCharge'])
        ->middleware('permission:admin.resorts.update,resort.bookings.update,resort.checkin.manage');

    // Payments — admin.reports.* + payments.*
    Route::get('payments',           [PaymentController::class, 'index'])  ->middleware('permission:payments.view,admin.reports.view,resort.payments.view,restaurant.billing.view');
    Route::post('payments',          [PaymentController::class, 'store'])  ->middleware('permission:payments.view,admin.reports.view,resort.payments.create');
    Route::get('payments/{payment}', [PaymentController::class, 'show'])   ->middleware('permission:payments.view,admin.reports.view,resort.payments.view,restaurant.billing.view');
    Route::put('payments/{payment}', [PaymentController::class, 'update']) ->middleware('permission:admin.reports.view');
    Route::delete('payments/{payment}',[PaymentController::class,'destroy'])->middleware('permission:admin.reports.view');

    // Payment receipt & workflow actions
    Route::get('payments/{payment}/receipt',      [PaymentController::class, 'receipt'])     ->middleware('permission:payments.view,admin.reports.view,resort.payments.view,restaurant.billing.view');
    Route::get('payments/{payment}/receipt/pdf',  [PaymentController::class, 'receiptPdf'])  ->middleware('permission:payments.pdf');
    Route::post('payments/{payment}/print',       [PaymentController::class, 'printReceipt'])->middleware('permission:payments.print');
    Route::post('payments/{payment}/refund',      [PaymentController::class, 'refund'])      ->middleware('permission:payments.refund');

    Route::post('bookings/{booking}/khqr', [KhqrPaymentController::class, 'store'])
        ->middleware('permission:payments.view,admin.reports.view,resort.payments.create');
    Route::post('khqr/verify', [KhqrPaymentController::class, 'verifyByMd5'])
        ->middleware('permission:payments.view,admin.reports.view,resort.payments.create');
    Route::post('payments/{payment}/khqr/verify', [KhqrPaymentController::class, 'verify'])
        ->middleware('permission:payments.view,admin.reports.view,resort.payments.create');

    Route::get('invoices',           [InvoiceController::class, 'index'])  ->middleware('permission:admin.reports.view,resort.invoices.view,resort.payments.view,payments.view');
    Route::post('invoices',          [InvoiceController::class, 'store'])  ->middleware('permission:admin.reports.view,resort.invoices.view,resort.payments.create');
    Route::get('invoices/{invoice}', [InvoiceController::class, 'show'])   ->middleware('permission:admin.reports.view,resort.invoices.view,resort.payments.view,payments.view');
    Route::get('invoices/{invoice}/pdf', [InvoiceController::class, 'downloadPdf'])->middleware('permission:payments.pdf,resort.invoices.view');
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

    $guestInquiryView = 'permission:admin.resorts.view,resort.guests.view,resort.bookings.view';
    $guestInquiryManage = 'permission:admin.resorts.update,resort.guests.update,resort.bookings.update';

    Route::get('activity-bookings', [ActivityBookingAdminController::class, 'index'])->middleware($guestInquiryView);
    Route::get('activity-bookings/{activity_booking}', [ActivityBookingAdminController::class, 'show'])->middleware($guestInquiryView);
    Route::patch('activity-bookings/{activity_booking}', [ActivityBookingAdminController::class, 'update'])->middleware($guestInquiryManage);
    Route::put('activity-bookings/{activity_booking}', [ActivityBookingAdminController::class, 'update'])->middleware($guestInquiryManage);

    Route::get('service-inquiries', [ServiceInquiryAdminController::class, 'index'])->middleware($guestInquiryView);
    Route::get('service-inquiries/{service_inquiry}', [ServiceInquiryAdminController::class, 'show'])->middleware($guestInquiryView);
    Route::patch('service-inquiries/{service_inquiry}', [ServiceInquiryAdminController::class, 'update'])->middleware($guestInquiryManage);
    Route::put('service-inquiries/{service_inquiry}', [ServiceInquiryAdminController::class, 'update'])->middleware($guestInquiryManage);

    Route::get('contact-inquiries', [ContactInquiryAdminController::class, 'index'])->middleware($guestInquiryView);
    Route::get('contact-inquiries/{contact_inquiry}', [ContactInquiryAdminController::class, 'show'])->middleware($guestInquiryView);
    Route::patch('contact-inquiries/{contact_inquiry}', [ContactInquiryAdminController::class, 'update'])->middleware($guestInquiryManage);
    Route::put('contact-inquiries/{contact_inquiry}', [ContactInquiryAdminController::class, 'update'])->middleware($guestInquiryManage);

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
