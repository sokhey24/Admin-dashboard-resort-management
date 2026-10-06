<?php

namespace Tests\Unit;

use App\Services\BookingService;
use Carbon\Carbon;
use Tests\TestCase;

class RoomAvailabilityCalculationTest extends TestCase
{
    protected BookingService $bookings;

    protected function setUp(): void
    {
        parent::setUp();
        $this->bookings = app(BookingService::class);
    }

    public function test_next_available_after_single_conflict(): void
    {
        $windows = [['check_in' => '2026-10-08', 'check_out' => '2026-10-11']];
        $next = $this->bookings->nextAvailableCheckInForStayLength(
            $windows,
            Carbon::parse('2026-10-08'),
            4
        );
        $this->assertSame('2026-10-11', $next);
    }

    public function test_back_to_back_bookings_push_next_available(): void
    {
        $windows = [
            ['check_in' => '2026-10-08', 'check_out' => '2026-10-11'],
            ['check_in' => '2026-10-11', 'check_out' => '2026-10-15'],
        ];
        $next = $this->bookings->nextAvailableCheckInForStayLength(
            $windows,
            Carbon::parse('2026-10-08'),
            4
        );
        $this->assertSame('2026-10-15', $next);
    }

    public function test_gap_does_not_fit_requested_stay_length(): void
    {
        $windows = [
            ['check_in' => '2026-10-08', 'check_out' => '2026-10-10'],
            ['check_in' => '2026-10-12', 'check_out' => '2026-10-15'],
        ];
        $next = $this->bookings->nextAvailableCheckInForStayLength(
            $windows,
            Carbon::parse('2026-10-08'),
            5
        );
        $this->assertSame('2026-10-15', $next);
    }

    public function test_overlap_uses_existing_semantics(): void
    {
        $windows = [['check_in' => '2026-09-20', 'check_out' => '2026-09-25']];
        $this->assertFalse($this->bookings->overlappingStayWindows(
            $windows,
            Carbon::parse('2026-09-25'),
            Carbon::parse('2026-09-28')
        ) !== []);
        $this->assertTrue($this->bookings->overlappingStayWindows(
            $windows,
            Carbon::parse('2026-09-24'),
            Carbon::parse('2026-09-28')
        ) !== []);
    }
}
