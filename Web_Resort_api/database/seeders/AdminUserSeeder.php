<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $accounts = [
            ['name' => 'Admin',       'email' => 'admin123@gmail.com',      'phone' => '02099990001', 'role' => 'admin',              'password' => '12345678'],
            ['name' => 'Sokhy Vann',  'email' => 'sokhyvann247@gmail.com',  'phone' => '02099990002', 'role' => 'resort_manager',     'password' => 'password'],
            ['name' => 'Sok',         'email' => 'sok123@gmail.com',        'phone' => '02099990003', 'role' => 'resort_staff',       'password' => 'password'],
            ['name' => 'Reaksa',      'email' => 'reaksa123@gmail.com',     'phone' => '02099990004', 'role' => 'restaurant_manager', 'password' => 'password'],
            ['name' => 'Kakada',      'email' => 'kakada123@gmail.com',     'phone' => '02099990005', 'role' => 'restaurant_staff',   'password' => 'password'],
        ];

        foreach ($accounts as $data) {
            $user = User::updateOrCreate(
                ['email' => $data['email']],
                [
                    'name'              => $data['name'],
                    'phone'             => $data['phone'],
                    'password'          => Hash::make($data['password']),
                    'status'            => 'active',
                    'email_verified_at' => now(),
                ]
            );

            $role = Role::where('name', $data['role'])->first();
            if ($role) {
                $user->roles()->sync($role->id);
            }
        }
    }
}
