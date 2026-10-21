<?php

namespace App\Providers;

use App\Models\Booking;
use App\Models\FoodOrder;
use App\Models\Payment;
use App\Models\Review;
use App\Policies\BookingPolicy;
use App\Policies\FoodOrderPolicy;
use App\Policies\PaymentPolicy;
use App\Policies\ReviewPolicy;
use App\Events\ActivityBookingCreated;
use App\Events\BookingCreated;
use App\Events\BookingPaid;
use App\Events\ContactInquiryCreated;
use App\Events\TableReservationRequested;
use App\Listeners\DispatchBookingCreatedSideEffects;
use App\Listeners\DispatchBookingPaidSideEffects;
use App\Listeners\DispatchTableReservationSideEffects;
use App\Listeners\PersistDomainNotifications;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    protected $policies = [
        Booking::class => BookingPolicy::class,
        Payment::class => PaymentPolicy::class,
        FoodOrder::class => FoodOrderPolicy::class,
        Review::class => ReviewPolicy::class,
    ];

    public function register(): void {}

    public function boot(): void
    {
        Request::enableHttpMethodParameterOverride();

        foreach ($this->policies as $model => $policy) {
            Gate::policy($model, $policy);
        }

        Event::listen(BookingCreated::class, DispatchBookingCreatedSideEffects::class);
        Event::listen(BookingCreated::class, [PersistDomainNotifications::class, 'onBookingCreated']);
        Event::listen(BookingPaid::class, DispatchBookingPaidSideEffects::class);
        Event::listen(BookingPaid::class, [PersistDomainNotifications::class, 'onBookingPaid']);
        Event::listen(ContactInquiryCreated::class, [PersistDomainNotifications::class, 'onContactInquiryCreated']);
        Event::listen(ActivityBookingCreated::class, [PersistDomainNotifications::class, 'onActivityBookingCreated']);
        Event::listen(TableReservationRequested::class, DispatchTableReservationSideEffects::class);
    }
}
