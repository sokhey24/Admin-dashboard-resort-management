<?php

namespace Database\Seeders;

use App\Models\CustomerLoyalty;
use App\Models\User;
use Illuminate\Database\Seeder;

class CustomerLoyaltySeeder extends Seeder
{
    public function run(): void
    {
        $rows = [
            'sophea@example.com' => ['points' => 14200, 'tier' => 'Gold Concierge', 'points_target' => 20000],
            'dara@example.com' => ['points' => 8500, 'tier' => 'Silver', 'points_target' => 20000],
            'virak@example.com' => ['points' => 3200, 'tier' => 'Bronze', 'points_target' => 10000],
            'sreymom@example.com' => ['points' => 19850, 'tier' => 'Gold Concierge', 'points_target' => 20000],
            'chanthy@example.com' => ['points' => 5600, 'tier' => 'Silver', 'points_target' => 20000],
            'ratana@example.com' => ['points' => 1200, 'tier' => 'Bronze', 'points_target' => 10000],
            'makara@example.com' => ['points' => 450, 'tier' => 'Bronze', 'points_target' => 10000],
        ];

        foreach ($rows as $email => $data) {
            $user = User::where('email', $email)->first();
            if (!$user) {
                continue;
            }

            CustomerLoyalty::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'points' => $data['points'],
                    'tier' => $data['tier'],
                    'points_target' => $data['points_target'],
                ]
            );
        }
    }
}
