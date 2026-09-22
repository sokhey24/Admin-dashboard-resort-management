<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        // 1. Seed all permissions
        $this->call(PermissionSeeder::class);

        // 2. Seed roles and assign permissions
        $this->call(RoleSeeder::class);

        // 3. Seed admin + staff accounts
        $this->call(AdminUserSeeder::class);

        // 4. Seed sample payments
        $this->call(PaymentSeeder::class);

        // 5. Seed sample customers
        $customerRole = Role::where('name', 'customer')->value('id');

        $customers = [
            ['name' => 'Sophea Meas',     'email' => 'sophea@example.com',   'phone' => '0961234501', 'gender' => 'female', 'status' => 'active'],
            ['name' => 'Dara Chann',      'email' => 'dara@example.com',     'phone' => '0961234502', 'gender' => 'male',   'status' => 'active'],
            ['name' => 'Bopha Keo',       'email' => 'bopha@example.com',    'phone' => '0961234503', 'gender' => 'female', 'status' => 'inactive'],
            ['name' => 'Virak Sok',       'email' => 'virak@example.com',    'phone' => '0961234504', 'gender' => 'male',   'status' => 'active'],
            ['name' => 'Sreymom Pich',    'email' => 'sreymom@example.com',  'phone' => '0961234505', 'gender' => 'female', 'status' => 'active'],
            ['name' => 'Kosal Heng',      'email' => 'kosal@example.com',    'phone' => '0961234506', 'gender' => 'male',   'status' => 'banned'],
            ['name' => 'Chanthy Lim',     'email' => 'chanthy@example.com',  'phone' => '0961234507', 'gender' => 'female', 'status' => 'active'],
            ['name' => 'Piseth Noun',     'email' => 'piseth@example.com',   'phone' => '0961234508', 'gender' => 'male',   'status' => 'inactive'],
            ['name' => 'Ratana Chhun',    'email' => 'ratana@example.com',   'phone' => '0961234509', 'gender' => 'female', 'status' => 'active'],
            ['name' => 'Makara Ung',      'email' => 'makara@example.com',   'phone' => '0961234510', 'gender' => 'male',   'status' => 'active'],
            ['name' => 'Leakhena Ros',    'email' => 'leakhena@example.com', 'phone' => '0961234511', 'gender' => 'female', 'status' => 'active'],
            ['name' => 'Bunthoeun Yim',   'email' => 'bunthoeun@example.com','phone' => '0961234512', 'gender' => 'male',   'status' => 'inactive'],
            ['name' => 'Sokunthea Pen',   'email' => 'sokunthea@example.com','phone' => '0961234513', 'gender' => 'female', 'status' => 'active'],
            ['name' => 'Veasna Tep',      'email' => 'veasna@example.com',   'phone' => '0961234514', 'gender' => 'male',   'status' => 'active'],
            ['name' => 'Channary Seng',   'email' => 'channary@example.com', 'phone' => '0961234515', 'gender' => 'female', 'status' => 'banned'],
        ];

        foreach ($customers as $data) {
            $user = User::firstOrCreate(
                ['email' => $data['email']],
                [
                    'name'              => $data['name'],
                    'phone'             => $data['phone'],
                    'gender'            => $data['gender'],
                    'status'            => $data['status'],
                    'password'          => Hash::make('password'),
                    'email_verified_at' => now(),
                ]
            );
            if ($customerRole) {
                $user->roles()->syncWithoutDetaching($customerRole);
            }
        }
    }
}
