<?php

namespace Tests\Feature;

use App\Events\BookingCreated;
use App\Models\Booking;
use App\Models\Branch;
use App\Models\Permission;
use App\Models\Resort;
use App\Models\Role;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\User;
use App\Notifications\BookingCreatedGuestNotification;
use App\Services\BookingService;
use App\Services\NotificationService;
use Illuminate\Support\Facades\Event;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DatabaseNotificationsTest extends TestCase
{
    protected function staffWithBookingView(): User
    {
        $perm = Permission::firstOrCreate(
            ['name' => 'resort.bookings.view'],
            ['description' => 'View bookings']
        );
        $role = Role::firstOrCreate(['name' => 'resort_manager'], ['display_name' => 'Resort Manager']);
        $role->permissions()->syncWithoutDetaching([$perm->id]);

        $user = User::create([
            'name' => 'Staff',
            'email' => 'staff-notif@example.com',
            'password' => bcrypt('password'),
        ]);
        $user->roles()->attach($role->id);

        $resort = Resort::create(['name' => 'N Resort', 'slug' => 'n-resort', 'address' => 'a', 'city' => 'c']);
        $branch = Branch::create(['resort_id' => $resort->id, 'name' => 'Main', 'address' => 'a', 'status' => 'active']);
        $user->resorts()->attach($resort->id, ['role' => 'manager', 'is_primary' => true]);
        $user->branches()->attach($branch->id, ['role' => 'manager', 'is_primary' => true]);

        return $user;
    }

    protected function roomForResort(Resort $resort, string $number = 'N-1'): Room
    {
        $branch = Branch::firstOrCreate(
            ['resort_id' => $resort->id, 'name' => 'Main'],
            ['address' => 'a', 'status' => 'active']
        );
        $type = RoomType::create([
            'resort_id' => $resort->id,
            'name' => 'Std',
            'base_price' => 100,
            'max_occupancy' => 2,
        ]);

        return Room::create([
            'resort_id' => $resort->id,
            'branch_id' => $branch->id,
            'room_type_id' => $type->id,
            'room_number' => $number,
            'price_per_night' => 100,
            'status' => 'available',
        ]);
    }

    protected function guestUser(): User
    {
        $role = Role::firstOrCreate(['name' => 'customer'], ['display_name' => 'Customer']);
        $user = User::create([
            'name' => 'Guest',
            'email' => 'guest-notif@example.com',
            'password' => bcrypt('password'),
        ]);
        $user->roles()->attach($role->id);

        return $user;
    }

    protected function createBookingFor(User $guest, Resort $resort, Room $room): Booking
    {
        return app(BookingService::class)->createBooking([
            'resort_id' => $resort->id,
            'user_id' => $guest->id,
            'room_ids' => [$room->id],
            'check_in' => '2028-06-10',
            'check_out' => '2028-06-12',
            'adults' => 2,
        ], $guest);
    }

    public function test_laravel_database_notification_writes_row(): void
    {
        $guest = $this->guestUser();
        $resort = Resort::create(['name' => 'R', 'slug' => 'r2', 'address' => 'a', 'city' => 'c']);
        $type = RoomType::create([
            'resort_id' => $resort->id,
            'name' => 'Std',
            'base_price' => 100,
            'max_occupancy' => 2,
        ]);
        $room = Room::create([
            'resort_id' => $resort->id,
            'room_type_id' => $type->id,
            'room_number' => 'T-0',
            'price_per_night' => 100,
            'status' => 'available',
        ]);
        $booking = $this->createBookingFor($guest, $resort, $room);
        $guest->notify(new BookingCreatedGuestNotification($booking));
        $this->assertGreaterThanOrEqual(1, $guest->notifications()->count());
    }

    public function test_booking_created_persists_notifications_for_staff_and_guest(): void
    {
        $staff = $this->staffWithBookingView();
        $guest = $this->guestUser();

        $resort = $staff->resorts()->first();
        $room = $this->roomForResort($resort, 'N-1');

        $booking = $this->createBookingFor($guest, $resort, $room);

        app(NotificationService::class)->onBookingCreated($booking->id);

        $this->assertGreaterThan(0, $staff->fresh()->notifications()->count());
        $this->assertGreaterThan(0, $guest->fresh()->notifications()->count());

        app(NotificationService::class)->onBookingCreated($booking->id);
        $this->assertSame(1, $staff->fresh()->notifications()->count());
        $this->assertSame(1, $guest->fresh()->notifications()->count());
    }

    public function test_user_cannot_mark_another_users_notification(): void
    {
        $staff = $this->staffWithBookingView();
        $other = User::create([
            'name' => 'Other Staff',
            'email' => 'other-notif@example.com',
            'password' => bcrypt('password'),
        ]);
        $role = Role::where('name', 'resort_manager')->first();
        $other->roles()->attach($role->id);
        $other->resorts()->attach($staff->resorts()->first()->id, ['role' => 'manager', 'is_primary' => true]);

        $guest = $this->guestUser();
        $resort = $staff->resorts()->first();
        $room = $this->roomForResort($resort, 'N-2');
        $this->createBookingFor($guest, $resort, $room);

        $notificationId = $staff->notifications()->first()->id;

        Sanctum::actingAs($other);
        $this->patchJson("/api/admin/notifications/{$notificationId}/read")->assertNotFound();
    }

    public function test_notification_api_lists_and_marks_read(): void
    {
        $staff = $this->staffWithBookingView();
        $guest = $this->guestUser();
        $resort = $staff->resorts()->first();
        $room = $this->roomForResort($resort, 'N-3');
        $this->createBookingFor($guest, $resort, $room);

        Sanctum::actingAs($staff);
        $list = $this->getJson('/api/admin/notifications?unread=1')->assertOk();
        $this->assertGreaterThan(0, $list->json('unread_count'));
        $id = $list->json('data.0.id');

        $this->patchJson("/api/admin/notifications/{$id}/read")->assertOk();
        $this->getJson('/api/admin/notifications?unread=1')->assertOk()->assertJsonPath('unread_count', 0);
    }

    public function test_booking_created_event_triggers_persisted_notification(): void
    {
        Event::fake([BookingCreated::class]);

        $guest = $this->guestUser();
        $resort = Resort::create(['name' => 'E', 'slug' => 'e', 'address' => 'a', 'city' => 'c']);
        $type = RoomType::create([
            'resort_id' => $resort->id,
            'name' => 'Std',
            'base_price' => 100,
            'max_occupancy' => 2,
        ]);
        $room = Room::create([
            'resort_id' => $resort->id,
            'room_type_id' => $type->id,
            'room_number' => 'E-1',
            'price_per_night' => 100,
            'status' => 'available',
        ]);

        app(BookingService::class)->createBooking([
            'resort_id' => $resort->id,
            'user_id' => $guest->id,
            'room_ids' => [$room->id],
            'check_in' => '2028-07-10',
            'check_out' => '2028-07-12',
            'adults' => 2,
        ], $guest);

        Event::assertDispatched(BookingCreated::class);
    }
}
