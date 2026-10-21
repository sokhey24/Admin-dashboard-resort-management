<?php

namespace Tests\Feature;

use App\Events\BookingCreated;
use App\Events\BookingPaid;
use App\Events\TableReservationRequested;
use App\Jobs\GenerateInvoicePdfJob;
use App\Jobs\SendBookingConfirmationEmailJob;
use App\Mail\BookingConfirmationMail;
use App\Models\Booking;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Resort;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\User;
use App\Services\BookingService;
use App\Services\DomainTaskGate;
use App\Services\PaymentService;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class DomainEventsTest extends TestCase
{
    protected function resortRoom(): array
    {
        $resort = Resort::create(['name' => 'Evt Resort', 'slug' => 'evt-resort', 'address' => 'a', 'city' => 'c']);
        $type = RoomType::create([
            'resort_id' => $resort->id,
            'name' => 'Std',
            'base_price' => 120,
            'max_occupancy' => 2,
        ]);
        $room = Room::create([
            'resort_id' => $resort->id,
            'room_type_id' => $type->id,
            'room_number' => 'E-1',
            'price_per_night' => 120,
            'status' => 'available',
        ]);

        return [$resort, $room];
    }

    public function test_booking_created_dispatches_event_after_commit(): void
    {
        Event::fake([BookingCreated::class]);

        [$resort, $room] = $this->resortRoom();
        $user = User::create([
            'name' => 'Guest',
            'email' => 'evt-guest@example.com',
            'password' => bcrypt('password'),
        ]);

        app(BookingService::class)->createBooking([
            'resort_id' => $resort->id,
            'user_id' => $user->id,
            'room_ids' => [$room->id],
            'check_in' => '2028-01-10',
            'check_out' => '2028-01-12',
            'adults' => 2,
        ], $user);

        Event::assertDispatched(BookingCreated::class);
    }

    public function test_paid_resort_payment_dispatches_booking_paid(): void
    {
        Event::fake([BookingPaid::class]);

        [$resort, $room] = $this->resortRoom();
        $staff = User::create([
            'name' => 'Staff',
            'email' => 'evt-staff@example.com',
            'password' => bcrypt('password'),
        ]);

        $booking = app(BookingService::class)->createBooking([
            'resort_id' => $resort->id,
            'room_ids' => [$room->id],
            'check_in' => '2028-02-10',
            'check_out' => '2028-02-12',
            'adults' => 2,
        ], $staff);

        Event::fake([BookingPaid::class]);

        app(PaymentService::class)->createResortPayment([
            'booking_id' => $booking->id,
            'amount' => (float) $booking->total_amount,
            'payment_method' => 'cash',
            'status' => 'paid',
        ], $staff);

        Event::assertDispatched(BookingPaid::class, function (BookingPaid $event) use ($booking) {
            return $event->bookingId === $booking->id;
        });
    }

    public function test_confirmation_email_job_is_idempotent(): void
    {
        Mail::fake();
        config(['services.resort.staff_inbox' => 'staff@example.com']);

        [$resort, $room] = $this->resortRoom();
        $user = User::create([
            'name' => 'Guest',
            'email' => 'dup-guest@example.com',
            'password' => bcrypt('password'),
        ]);

        $booking = app(BookingService::class)->createBooking([
            'resort_id' => $resort->id,
            'user_id' => $user->id,
            'room_ids' => [$room->id],
            'check_in' => '2028-03-10',
            'check_out' => '2028-03-12',
            'adults' => 2,
        ], $user);

        $job = new SendBookingConfirmationEmailJob($booking->id);
        $job->handle(app(DomainTaskGate::class));
        $job->handle(app(DomainTaskGate::class));

        Mail::assertSent(BookingConfirmationMail::class, 1);
    }

    public function test_invoice_pdf_job_does_not_regenerate_when_path_exists(): void
    {
        Storage::fake('local');

        [$resort, $room] = $this->resortRoom();
        $staff = User::create([
            'name' => 'Staff',
            'email' => 'pdf-staff@example.com',
            'password' => bcrypt('password'),
        ]);

        $booking = app(BookingService::class)->createBooking([
            'resort_id' => $resort->id,
            'room_ids' => [$room->id],
            'check_in' => '2028-04-10',
            'check_out' => '2028-04-12',
            'adults' => 2,
        ], $staff);

        $payment = Payment::create([
            'booking_id' => $booking->id,
            'user_id' => $booking->user_id,
            'source' => 'resort',
            'amount' => 240,
            'method' => 'cash',
            'payment_method' => 'cash',
            'paid_amount' => 240,
            'balance' => 0,
            'status' => 'paid',
            'paid_at' => now(),
            'transaction_ref' => 'TXN-TEST',
        ]);

        $invoice = Invoice::create([
            'booking_id' => $booking->id,
            'payment_id' => $payment->id,
            'invoice_number' => 'INV-TEST',
            'amount' => 240,
            'tax' => 0,
            'total' => 240,
            'status' => 'paid',
            'pdf_disk' => 'local',
            'pdf_path' => 'invoices/1/existing.pdf',
            'pdf_generated_at' => now(),
        ]);

        Storage::disk('local')->put('invoices/1/existing.pdf', 'pdf-bytes');

        $job = new GenerateInvoicePdfJob($payment->id);
        $job->handle(app(\App\Services\PaymentReceiptService::class));

        Storage::disk('local')->assertExists('invoices/1/existing.pdf');
        $this->assertSame('invoices/1/existing.pdf', $invoice->fresh()->pdf_path);
    }

    public function test_table_reservation_dispatches_event(): void
    {
        Event::fake([TableReservationRequested::class]);

        $this->postJson('/api/customer/table-reservation-requests', [
            'guest_name' => 'Sam',
            'guest_email' => 'sam@example.com',
            'guest_phone' => '+85512345678',
            'guest_count' => 2,
            'reservation_date' => '2028-05-01',
            'reservation_time' => '18:30',
        ])->assertCreated();

        Event::assertDispatched(TableReservationRequested::class);
    }
}
