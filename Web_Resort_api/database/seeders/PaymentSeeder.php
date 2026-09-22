<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\Branch;
use App\Models\FoodOrder;
use App\Models\Payment;
use App\Models\Resort;
use App\Models\RestaurantTable;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class PaymentSeeder extends Seeder
{
    public function run(): void
    {
        // Ensure users exist
        $users = User::whereIn('email', [
            'sophea@example.com', 'dara@example.com', 'bopha@example.com',
            'virak@example.com', 'sreymom@example.com',
        ])->get();

        if ($users->count() < 3) {
            $this->command->warn('Not enough users. Run DatabaseSeeder first.');
            return;
        }

        // Ensure resort infrastructure exists
        $resort = Resort::firstOrCreate(
            ['email' => 'info@grandresort.com'],
            [
                'name' => 'Grand Resort & Spa',
                'slug' => 'grand-resort-spa',
                'phone' => '+855 23 000 000',
                'address' => '123 Resort Boulevard',
                'city' => 'Phnom Penh',
                'country' => 'Cambodia',
                'status' => 'active',
            ]
        );

        $branch = Branch::firstOrCreate(
            ['resort_id' => $resort->id, 'name' => 'Main Branch'],
            [
                'address' => '123 Resort Boulevard, Phnom Penh',
                'phone' => '+855 23 000 000',
                'status' => 'active',
            ]
        );

        // Room types
        $roomTypes = [
            ['name' => 'Deluxe Room', 'base_price' => 150],
            ['name' => 'Suite', 'base_price' => 300],
            ['name' => 'Villa', 'base_price' => 500],
        ];

        $createdRoomTypes = [];
        foreach ($roomTypes as $type) {
            $rt = RoomType::firstOrCreate(
                ['resort_id' => $resort->id, 'name' => $type['name']],
                ['base_price' => $type['base_price'], 'status' => 'active']
            );
            $createdRoomTypes[] = $rt;
        }

        // Rooms
        $rooms = [
            ['room_number' => '101', 'room_type_id' => $createdRoomTypes[0]->id, 'price_per_night' => 150, 'floor' => '1', 'view' => 'Garden'],
            ['room_number' => '201', 'room_type_id' => $createdRoomTypes[1]->id, 'price_per_night' => 300, 'floor' => '2', 'view' => 'Ocean'],
            ['room_number' => '301', 'room_type_id' => $createdRoomTypes[2]->id, 'price_per_night' => 500, 'floor' => '3', 'view' => 'Beach'],
        ];

        $createdRooms = [];
        foreach ($rooms as $room) {
            $r = Room::firstOrCreate(
                ['resort_id' => $resort->id, 'room_number' => $room['room_number']],
                [
                    'branch_id' => $branch->id,
                    'room_type_id' => $room['room_type_id'],
                    'price_per_night' => $room['price_per_night'],
                    'floor' => $room['floor'],
                    'view' => $room['view'],
                    'status' => 'available',
                ]
            );
            $createdRooms[] = $r;
        }

        // Restaurant tables
        $tables = [
            ['table_number' => 'T1', 'capacity' => 2, 'location' => 'Indoor - Window'],
            ['table_number' => 'T2', 'capacity' => 4, 'location' => 'Outdoor - Patio'],
        ];

        $createdTables = [];
        foreach ($tables as $table) {
            $t = RestaurantTable::firstOrCreate(
                ['resort_id' => $resort->id, 'table_number' => $table['table_number']],
                [
                    'capacity' => $table['capacity'],
                    'location' => $table['location'],
                    'status' => 'available',
                ]
            );
            $createdTables[] = $t;
        }

        // === BOOKINGS ===
        $b1 = Booking::firstOrCreate(['booking_code' => 'BK-00125'], [
            'user_id' => $users[0]->id,
            'resort_id' => $resort->id,
            'check_in' => now()->subDays(5),
            'check_out' => now()->subDays(2),
            'adults' => 2,
            'children' => 0,
            'subtotal' => 450,
            'discount' => 0,
            'total_amount' => 450,
            'status' => 'completed',
        ]);
        $b1->rooms()->sync([$createdRooms[0]->id => ['price_per_night' => 150, 'nights' => 3, 'subtotal' => 450]]);

        $b2 = Booking::firstOrCreate(['booking_code' => 'BK-00126'], [
            'user_id' => $users[1]->id,
            'resort_id' => $resort->id,
            'check_in' => now()->addDay(),
            'check_out' => now()->addDays(3),
            'adults' => 2,
            'children' => 1,
            'subtotal' => 600,
            'discount' => 0,
            'total_amount' => 600,
            'status' => 'confirmed',
        ]);
        $b2->rooms()->sync([$createdRooms[1]->id => ['price_per_night' => 300, 'nights' => 2, 'subtotal' => 600]]);

        // === FOOD ORDERS ===
        $o1 = FoodOrder::firstOrCreate(['order_code' => 'ORD-00452'], [
            'user_id' => $users[0]->id,
            'restaurant_table_id' => $createdTables[1]->id,
            'subtotal' => 35,
            'tax' => 3.50,
            'total' => 38.50,
            'status' => 'completed',
            'note' => 'Birthday celebration',
        ]);

        $o2 = FoodOrder::firstOrCreate(['order_code' => 'ORD-00453'], [
            'user_id' => $users[1]->id,
            'restaurant_table_id' => $createdTables[0]->id,
            'subtotal' => 20,
            'tax' => 2,
            'total' => 22,
            'status' => 'completed',
        ]);

        // === PAYMENTS ===
        // PAY-001: PAID - Resort (KHQR)
        $this->createPayment('PAY-001', 'resort', Booking::class, $b1->id, $b1->user_id, 450, 'paid', 'KHQR', 'ABA Pay', now()->subDays(5), null, 0, 450, 0);

        // PAY-002: PAID - Restaurant (Cash)
        $this->createPayment('PAY-002', 'restaurant', FoodOrder::class, $o1->id, $o1->user_id, 38.50, 'paid', 'Cash', null, now()->subDays(3), null, 0, 38.50, 0);

        // PAY-003: PENDING - Resort (Visa)
        $this->createPayment('PAY-003', 'resort', Booking::class, $b2->id, $b2->user_id, 600, 'pending', 'Visa', 'Stripe', null, null, 0, 0, 600);

        // PAY-004: REFUNDED - Restaurant (KHQR)
        $this->createPayment('PAY-004', 'restaurant', FoodOrder::class, $o2->id, $o2->user_id, 22, 'refunded', 'KHQR', 'Wing', now()->subDays(2), now()->subDay(), 22, 22, 0);

        $this->command->info('PaymentSeeder: 4 payments created');
        $this->command->info('- PAY-001: Paid (Resort, KHQR) - $450');
        $this->command->info('- PAY-002: Paid (Restaurant, Cash) - $38.50');
        $this->command->info('- PAY-003: Pending (Resort, Visa) - $600');
        $this->command->info('- PAY-004: Refunded (Restaurant, KHQR) - $22');
    }

    protected function createPayment(
        string $id,
        string $source,
        string $refType,
        int $refId,
        int $userId,
        float $amount,
        string $status,
        string $method,
        ?string $gateway,
        ?\Carbon\Carbon $paidAt,
        ?\Carbon\Carbon $refundedAt,
        float $refundAmount,
        float $paidAmount,
        float $balance
    ): Payment {
        return Payment::create([
            'payment_id' => $id,
            'source' => $source,
            'reference_type' => $refType,
            'reference_id' => $refId,
            'user_id' => $userId,
            'amount' => $amount,
            'currency' => 'USD',
            'method' => $method,
            'payment_method' => $method,
            'gateway' => $gateway,
            'transaction_ref' => $gateway ? 'TXN-' . strtoupper(Str::random(8)) : null,
            'subtotal' => $amount,
            'discount' => 0,
            'tax' => 0,
            'service_charge' => 0,
            'paid_amount' => $paidAmount,
            'balance' => $balance,
            'refund_amount' => $refundAmount,
            'status' => $status,
            'paid_at' => $paidAt,
            'refunded_at' => $refundedAt,
            'created_by' => 1,
            'updated_by' => 1,
        ]);
    }
}