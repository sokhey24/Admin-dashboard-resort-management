<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Resort;
use App\Models\Role;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\User;
use App\Models\Payment;
use App\Services\BakongKhqrService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Mockery;
use Tests\TestCase;

class GuestKhqrPaymentTest extends TestCase
{
    use RefreshDatabase;

    protected function customer(): User
    {
        $user = User::create([
            'name' => 'Guest',
            'email' => 'khqr@example.com',
            'password' => bcrypt('password123'),
        ]);
        $role = Role::firstOrCreate(['name' => 'customer'], ['display_name' => 'Customer']);
        $user->roles()->attach($role->id);

        return $user;
    }

    protected function bookingFor(User $user): Booking
    {
        $resort = Resort::create(['name' => 'R', 'slug' => 'r', 'address' => 'a', 'city' => 'c']);
        $type = RoomType::create([
            'resort_id' => $resort->id,
            'name' => 'Std',
            'base_price' => 100,
            'max_occupancy' => 4,
        ]);
        $room = Room::create([
            'resort_id' => $resort->id,
            'room_type_id' => $type->id,
            'room_number' => 'K-1',
            'price_per_night' => 100,
            'status' => 'available',
        ]);

        Sanctum::actingAs($user);

        $id = $this->postJson('/api/customer/bookings', [
            'resort_id' => $resort->id,
            'room_ids' => [$room->id],
            'check_in' => '2027-08-01',
            'check_out' => '2027-08-03',
            'adults' => 2,
        ])->assertCreated()->json('data.id');

        return Booking::findOrFail($id);
    }

    public function test_khqr_amount_comes_from_booking_balance_not_request(): void
    {
        $user = $this->customer();
        $booking = $this->bookingFor($user);

        $mock = Mockery::mock(BakongKhqrService::class);
        $mock->shouldReceive('generate')
            ->once()
            ->with(Mockery::on(fn ($amt) => abs($amt - (float) $booking->total_amount) < 0.01))
            ->andReturn(['qr' => 'QR-DATA', 'md5' => 'a1b2c3d4e5f6789012345678901234ab']);
        $this->app->instance(BakongKhqrService::class, $mock);

        Sanctum::actingAs($user);
        $response = $this->postJson("/api/customer/bookings/{$booking->id}/khqr", [
            'amount' => 1,
            'gateway' => 'aba-khqr',
        ])->assertCreated();

        $this->assertEqualsWithDelta(
            (float) $booking->total_amount,
            (float) $response->json('data.amount'),
            0.009
        );
    }

    public function test_verify_settles_payment_and_clears_balance(): void
    {
        $user = $this->customer();
        $booking = $this->bookingFor($user);

        $mock = Mockery::mock(BakongKhqrService::class);
        $mock->shouldReceive('generate')->once()->andReturn([
            'qr' => 'QR-DATA',
            'md5' => 'fedcba9876543210fedcba9876543210',
        ]);
        $mock->shouldReceive('checkByMd5')->once()->andReturn([
            'state' => 'paid',
            'message' => 'ok',
            'data' => [
                'amount' => (float) $booking->total_amount,
                'currency' => 'USD',
                'hash' => 'bakong-hash-1',
            ],
        ]);
        $mock->shouldReceive('transactionMatches')->once()->andReturn(true);
        $this->app->instance(BakongKhqrService::class, $mock);

        Sanctum::actingAs($user);
        $paymentId = $this->postJson("/api/customer/bookings/{$booking->id}/khqr")
            ->assertCreated()
            ->json('data.id');

        $this->postJson("/api/customer/payments/{$paymentId}/khqr/verify")
            ->assertOk()
            ->assertJsonPath('paid', true);

        $booking->refresh();
        $this->assertSame(0.0, (float) $booking->balance_due);
    }

    public function test_verify_settles_when_bakong_paid_after_qr_ttl(): void
    {
        $user = $this->customer();
        $booking = $this->bookingFor($user);

        $mock = Mockery::mock(BakongKhqrService::class);
        $mock->shouldReceive('generate')->once()->andReturn([
            'qr' => 'QR-DATA',
            'md5' => '11112222333344445555666677778888',
        ]);
        $mock->shouldReceive('checkByMd5')->once()->andReturn([
            'state' => 'paid',
            'message' => 'ok',
            'data' => [
                'amount' => (float) $booking->total_amount,
                'currency' => 'USD',
                'hash' => 'bakong-hash-late',
            ],
        ]);
        $mock->shouldReceive('transactionMatches')->once()->andReturn(true);
        $this->app->instance(BakongKhqrService::class, $mock);

        Sanctum::actingAs($user);
        $paymentId = $this->postJson("/api/customer/bookings/{$booking->id}/khqr")
            ->assertCreated()
            ->json('data.id');

        Payment::findOrFail($paymentId)->update(['expires_at' => now()->subMinute()]);

        $this->postJson("/api/customer/payments/{$paymentId}/khqr/verify")
            ->assertOk()
            ->assertJsonPath('paid', true);

        $this->assertSame('paid', Payment::findOrFail($paymentId)->status);
    }

    public function test_verify_stays_pending_during_grace_after_qr_ttl(): void
    {
        config(['services.bakong.verify_grace_seconds' => 300]);
        $user = $this->customer();
        $booking = $this->bookingFor($user);

        $mock = Mockery::mock(BakongKhqrService::class);
        $mock->shouldReceive('generate')->once()->andReturn([
            'qr' => 'QR-DATA',
            'md5' => 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        ]);
        $mock->shouldReceive('checkByMd5')->once()->andReturn([
            'state' => 'pending',
            'message' => 'Waiting for payment.',
        ]);
        $this->app->instance(BakongKhqrService::class, $mock);

        Sanctum::actingAs($user);
        $paymentId = $this->postJson("/api/customer/bookings/{$booking->id}/khqr")
            ->assertCreated()
            ->json('data.id');

        Payment::findOrFail($paymentId)->update(['expires_at' => now()->subSeconds(30)]);

        $this->postJson("/api/customer/payments/{$paymentId}/khqr/verify")
            ->assertOk()
            ->assertJsonPath('paid', false)
            ->assertJsonPath('status', 'pending');

        $this->assertSame('pending', Payment::findOrFail($paymentId)->status);
    }

    public function test_verify_amount_mismatch_does_not_settle(): void
    {
        $user = $this->customer();
        $booking = $this->bookingFor($user);

        $mock = Mockery::mock(BakongKhqrService::class);
        $mock->shouldReceive('generate')->once()->andReturn([
            'qr' => 'QR-DATA',
            'md5' => 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        ]);
        $mock->shouldReceive('checkByMd5')->once()->andReturn([
            'state' => 'paid',
            'message' => 'ok',
            'data' => [
                'amount' => 0.01,
                'currency' => 'USD',
                'hash' => 'wrong-amount',
            ],
        ]);
        $mock->shouldReceive('transactionMatches')->once()->andReturn(false);
        $this->app->instance(BakongKhqrService::class, $mock);

        Sanctum::actingAs($user);
        $paymentId = $this->postJson("/api/customer/bookings/{$booking->id}/khqr")
            ->assertCreated()
            ->json('data.id');

        $this->postJson("/api/customer/payments/{$paymentId}/khqr/verify")
            ->assertStatus(409)
            ->assertJsonPath('paid', false)
            ->assertJsonPath('status', 'failed');

        $this->assertSame('failed', Payment::findOrFail($paymentId)->status);
        $booking->refresh();
        $this->assertGreaterThan(0, (float) $booking->balance_due);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}
