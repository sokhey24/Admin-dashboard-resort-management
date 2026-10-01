<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Resort;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Ensures a single Solara brand row and sample branch destinations without removing existing data.
 */
class SolaraBrandSeeder extends Seeder
{
    public function run(): void
    {
        $brand = Resort::firstOrCreate(
            ['slug' => 'solara-resort'],
            [
                'name' => 'Solara Resort & Spa',
                'email' => 'info@solararesort.com',
                'phone' => '+855 63 000 100',
                'address' => 'National Road 6, Head Office',
                'city' => 'Siem Reap',
                'country' => 'Cambodia',
                'tagline' => 'Luxury escapes across Cambodia',
                'status' => 'active',
                'featured' => true,
            ]
        );

        $destinations = [
            [
                'name' => 'Solara Siem Reap',
                'city' => 'Siem Reap',
                'address' => 'National Road 6, Siem Reap',
                'phone' => '+855 63 000 101',
            ],
            [
                'name' => 'Solara Kampot',
                'city' => 'Kampot Riverside',
                'address' => 'Preah Monivong Blvd, Kampot',
                'phone' => '+855 33 000 102',
            ],
            [
                'name' => 'Solara Koh Rong',
                'city' => 'Koh Rong Island',
                'address' => 'Sok San Beach, Koh Rong',
                'phone' => '+855 36 000 103',
            ],
        ];

        foreach ($destinations as $row) {
            Branch::firstOrCreate(
                [
                    'resort_id' => $brand->id,
                    'name' => $row['name'],
                ],
                [
                    'slug' => Str::slug($row['name']),
                    'city' => $row['city'],
                    'address' => $row['address'],
                    'phone' => $row['phone'],
                    'email' => 'stay@'.Str::slug($row['city']).'.solararesort.com',
                    'stars' => 5,
                    'status' => 'active',
                ]
            );
        }
    }
}
