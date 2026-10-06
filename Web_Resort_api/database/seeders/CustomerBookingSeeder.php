<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\Resort;
use App\Models\Room;
use App\Models\User;
use Illuminate\Database\Seeder;

class CustomerBookingSeeder extends Seeder
{
    public function run(): void
    {
        $resort = Resort::query()->first();
        if (!$resort) {
            $this->command?->warn('CustomerBookingSeeder: no resort found. Run PaymentSeeder first.');

            return;
        }

        $rooms = Room::where('resort_id', $resort->id)->orderBy('id')->get();
        if ($rooms->isEmpty()) {
            $this->command?->warn('CustomerBookingSeeder: no rooms found.');

            return;
        }

        $roomA = $rooms[0];
        $roomB = $rooms->count() > 1 ? $rooms[1] : $roomA;
        $roomC = $rooms->count() > 2 ? $rooms[2] : $roomB;

        $plans = [
            'sophea@example.com' => [
                ['code' => 'BK-DEMO-SOP-1', 'status' => 'completed', 'check_in' => now()->subDays(30), 'check_out' => now()->subDays(27), 'room' => $roomA, 'nights' => 3, 'rate' => 150],
                ['code' => 'BK-DEMO-SOP-2', 'status' => 'confirmed', 'check_in' => now()->addDays(10), 'check_out' => now()->addDays(13), 'room' => $roomB, 'nights' => 3, 'rate' => 300],
            ],
            'dara@example.com' => [
                ['code' => 'BK-DEMO-DAR-1', 'status' => 'confirmed', 'check_in' => now()->addDays(5), 'check_out' => now()->addDays(7), 'room' => $roomA, 'nights' => 2, 'rate' => 150],
            ],
            'virak@example.com' => [],
            'sreymom@example.com' => [
                ['code' => 'BK-DEMO-SRE-1', 'status' => 'completed', 'check_in' => now()->subDays(60), 'check_out' => now()->subDays(58), 'room' => $roomC, 'nights' => 2, 'rate' => 500],
                ['code' => 'BK-DEMO-SRE-2', 'status' => 'cancelled', 'check_in' => now()->addDays(20), 'check_out' => now()->addDays(22), 'room' => $roomB, 'nights' => 2, 'rate' => 300],
                ['code' => 'BK-DEMO-SRE-3', 'status' => 'confirmed', 'check_in' => now()->addDays(40), 'check_out' => now()->addDays(43), 'room' => $roomA, 'nights' => 3, 'rate' => 150],
            ],
        ];

        foreach ($plans as $email => $bookings) {
            $user = User::where('email', $email)->first();
            if (!$user) {
                continue;
            }

            foreach ($bookings as $row) {
                $subtotal = $row['rate'] * $row['nights'];
                $booking = Booking::firstOrCreate(
                    ['booking_code' => $row['code']],
                    [
                        'user_id' => $user->id,
                        'resort_id' => $resort->id,
                        'branch_id' => $row['room']->branch_id,
                        'check_in' => $row['check_in'],
                        'check_out' => $row['check_out'],
                        'adults' => 2,
                        'children' => 0,
                        'nights' => $row['nights'],
                        'subtotal' => $subtotal,
                        'discount' => 0,
                        'total_amount' => $subtotal,
                        'status' => $row['status'],
                        'source' => 'website',
                    ]
                );

                $booking->rooms()->sync([
                    $row['room']->id => [
                        'price_per_night' => $row['rate'],
                        'nights' => $row['nights'],
                        'subtotal' => $subtotal,
                    ],
                ]);
            }
        }
    }
}
