<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Branch;
use App\Models\DailyAuditReport;
use App\Models\DomainTaskDedupe;
use App\Models\Permission;
use App\Models\Resort;
use App\Models\Role;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\User;
use App\Services\NightAuditService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Artisan;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class NightAuditTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config([
            'night_audit.timezone' => 'UTC',
            'night_audit.currency' => 'USD',
            'night_audit.no_show_enabled' => true,
            'night_audit.no_show_penalty_enabled' => false,
        ]);
    }

    protected function reportsAdmin(): User
    {
        $role = Role::create(['name' => 'reports_'.uniqid(), 'display_name' => 'Reports']);
        $role->permissions()->attach(
            Permission::firstOrCreate(['name' => 'admin.reports.view'], ['description' => 'Reports'])->id
        );
        $user = User::create([
            'name' => 'Reports Admin',
            'email' => 'reports-'.uniqid().'@example.com',
            'password' => bcrypt('secret'),
        ]);
        $user->roles()->attach($role->id);

        return $user;
    }

    protected function resortWithBranch(): array
    {
        $resort = Resort::create(['name' => 'Audit Resort', 'slug' => 'audit-'.uniqid(), 'address' => 'a', 'city' => 'c']);
        $branch = Branch::create([
            'resort_id' => $resort->id,
            'name' => 'Main',
            'slug' => 'main-'.uniqid(),
            'city' => 'c',
            'address' => 'Main St',
            'status' => 'active',
            'is_active' => true,
        ]);

        return [$resort, $branch];
    }

    protected function room(Resort $resort, Branch $branch, string $number, float $rate = 100, string $status = 'available'): Room
    {
        $type = RoomType::create([
            'resort_id' => $resort->id,
            'branch_id' => $branch->id,
            'name' => 'Type '.$number,
            'base_price' => $rate,
            'max_occupancy' => 2,
        ]);

        return Room::create([
            'resort_id' => $resort->id,
            'branch_id' => $branch->id,
            'room_type_id' => $type->id,
            'room_number' => $number,
            'price_per_night' => $rate,
            'status' => $status,
        ]);
    }

    protected function bookingOnRoom(
        Room $room,
        string $checkIn,
        string $checkOut,
        string $status = 'confirmed',
        ?string $checkedInAt = null
    ): Booking {
        $nights = max(1, (int) Carbon::parse($checkIn)->diffInDays(Carbon::parse($checkOut)));
        $booking = Booking::create([
            'user_id' => User::create([
                'name' => 'G',
                'email' => 'g-'.uniqid().'@example.com',
                'password' => bcrypt('x'),
            ])->id,
            'booking_code' => 'BK-'.strtoupper(uniqid()),
            'resort_id' => $room->resort_id,
            'branch_id' => $room->branch_id,
            'check_in' => $checkIn,
            'check_out' => $checkOut,
            'adults' => 2,
            'nights' => $nights,
            'subtotal' => 100 * $nights,
            'total_amount' => 100 * $nights,
            'balance_due' => 100 * $nights,
            'status' => $status,
            'checked_in_at' => $checkedInAt,
        ]);
        $rate = (float) $room->price_per_night;
        $booking->rooms()->attach($room->id, [
            'price_per_night' => $rate,
            'nights' => $nights,
            'subtotal' => $rate * $nights,
            'net_subtotal' => $rate * $nights,
            'discount_percent' => 0,
            'discount_amount' => 0,
        ]);

        return $booking;
    }

    public function test_historical_occupancy_uses_stay_overlap_not_room_status(): void
    {
        Carbon::setTestNow('2027-07-10 12:00:00');
        [$resort, $branch] = $this->resortWithBranch();
        $r1 = $this->room($resort, $branch, '101');
        $this->room($resort, $branch, '102');
        $this->bookingOnRoom($r1, '2027-07-09', '2027-07-11', 'confirmed');
        $r1->update(['status' => 'available']);

        $report = app(NightAuditService::class)->runForBranch(
            $branch,
            Carbon::parse('2027-07-10', 'UTC')
        );

        $this->assertSame(2, $report->sellable_rooms);
        $this->assertSame(1, $report->occupied_rooms);
        $this->assertEqualsWithDelta(50.0, (float) $report->occupancy_rate, 0.01);
        Carbon::setTestNow();
    }

    public function test_adr_and_revpar_from_room_revenue(): void
    {
        [$resort, $branch] = $this->resortWithBranch();
        $room = $this->room($resort, $branch, '201', 120);
        $this->bookingOnRoom($room, '2027-08-01', '2027-08-03', 'checked_in', now()->toDateTimeString());

        $report = app(NightAuditService::class)->runForBranch(
            $branch,
            Carbon::parse('2027-08-01', 'UTC')
        );

        $this->assertEqualsWithDelta(120.0, (float) $report->room_revenue, 0.01);
        $this->assertEqualsWithDelta(120.0, (float) $report->adr, 0.01);
        $this->assertEqualsWithDelta(120.0, (float) $report->revpar, 0.01);
    }

    public function test_zero_sellable_rooms_yields_zero_rates(): void
    {
        [$resort, $branch] = $this->resortWithBranch();
        $this->room($resort, $branch, 'M1', 100, 'maintenance');

        $report = app(NightAuditService::class)->runForBranch(
            $branch,
            Carbon::parse('2027-08-05', 'UTC')
        );

        $this->assertSame(0, $report->sellable_rooms);
        $this->assertSame(0.0, (float) $report->occupancy_rate);
        $this->assertSame(0.0, (float) $report->revpar);
    }

    public function test_no_show_cancels_eligible_arrivals(): void
    {
        [$resort, $branch] = $this->resortWithBranch();
        $room = $this->room($resort, $branch, '301');
        $booking = $this->bookingOnRoom($room, '2027-09-01', '2027-09-03', 'confirmed');

        $report = app(NightAuditService::class)->runForBranch(
            $branch,
            Carbon::parse('2027-09-01', 'UTC')
        );

        $booking->refresh();
        $this->assertSame('cancelled', $booking->status);
        $this->assertSame(1, $report->no_show_count);
        $this->assertStringContainsString('No-show', (string) $booking->cancellation_reason);
    }

    public function test_no_show_processing_is_idempotent(): void
    {
        [$resort, $branch] = $this->resortWithBranch();
        $room = $this->room($resort, $branch, '401');
        $booking = $this->bookingOnRoom($room, '2027-09-10', '2027-09-12', 'confirmed');
        $date = Carbon::parse('2027-09-10', 'UTC');
        $service = app(NightAuditService::class);

        $service->runForBranch($branch, $date);
        $booking->refresh();
        $this->assertSame('cancelled', $booking->status);

        $second = $service->runForBranch($branch, $date);
        $this->assertSame(0, $second->no_show_count);
        $this->assertSame(2, $second->run_count);
        $this->assertSame(1, DomainTaskDedupe::query()->where(
            'task_key',
            'night_audit:no_show:'.$booking->id.':2027-09-10'
        )->count());
    }

    public function test_branch_isolation_for_metrics(): void
    {
        [$resort, $branchA] = $this->resortWithBranch();
        $branchB = Branch::create([
            'resort_id' => $resort->id,
            'name' => 'Wing B',
            'slug' => 'b-'.uniqid(),
            'city' => 'c',
            'address' => 'Wing B',
            'status' => 'active',
            'is_active' => true,
        ]);
        $roomA = $this->room($resort, $branchA, 'A1');
        $roomB = $this->room($resort, $branchB, 'B1');
        $this->bookingOnRoom($roomA, '2027-09-28', '2027-10-03', 'checked_in', now()->toDateTimeString());
        $this->bookingOnRoom($roomB, '2027-09-28', '2027-10-03', 'checked_in', now()->toDateTimeString());

        $reportA = app(NightAuditService::class)->runForBranch($branchA, Carbon::parse('2027-10-01', 'UTC'));
        $this->assertSame(1, $reportA->occupied_rooms);
        $this->assertEqualsWithDelta(100.0, (float) $reportA->room_revenue, 0.01);
    }

    public function test_operational_date_respects_configured_timezone(): void
    {
        config(['night_audit.timezone' => 'Asia/Phnom_Penh']);
        $service = app(NightAuditService::class);
        $date = $service->resolveOperationalDate('2027-11-15');
        $this->assertSame('2027-11-15', $date->toDateString());
        $this->assertSame('Asia/Phnom_Penh', $date->timezone->getName());
    }

    public function test_manual_run_requires_confirmation(): void
    {
        $admin = $this->reportsAdmin();
        Sanctum::actingAs($admin);

        $this->postJson('/api/admin/reports/night-audits/run', [])
            ->assertStatus(422);
    }

    public function test_manual_run_endpoint_executes_audit(): void
    {
        [$resort, $branch] = $this->resortWithBranch();
        $this->room($resort, $branch, '501');
        $admin = $this->reportsAdmin();
        Sanctum::actingAs($admin);

        $this->postJson('/api/admin/reports/night-audits/run', [
            'date' => '2027-12-01',
            'branch_id' => $branch->id,
            'confirm' => true,
        ])->assertOk()->assertJsonPath('success', true);

        $this->assertTrue(
            DailyAuditReport::query()
                ->where('branch_id', $branch->id)
                ->whereDate('operational_date', '2027-12-01')
                ->where('status', DailyAuditReport::STATUS_COMPLETED)
                ->exists()
        );
    }

    public function test_artisan_command_succeeds(): void
    {
        [$resort, $branch] = $this->resortWithBranch();
        $this->room($resort, $branch, '601');

        $exit = Artisan::call('resort:night-audit', [
            '--date' => '2028-01-01',
            '--branch' => (string) $branch->id,
        ]);

        $this->assertSame(0, $exit);
        $this->assertStringContainsString('completed', strtolower(Artisan::output()));
    }
}
