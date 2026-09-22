<?php

namespace Database\Seeders;

use App\Models\Permission;
use Illuminate\Database\Seeder;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            // ── Admin ──────────────────────────────────────────────────
            'admin.dashboard.view'           => 'View admin dashboard',
            'admin.users.view'               => 'View users',
            'admin.users.create'             => 'Create users',
            'admin.users.update'             => 'Update users',
            'admin.users.delete'             => 'Delete users',
            'admin.roles.view'               => 'View roles',
            'admin.roles.create'             => 'Create roles',
            'admin.roles.update'             => 'Update roles',
            'admin.roles.delete'             => 'Delete roles',
            'admin.permissions.view'         => 'View permissions',
            'admin.permissions.create'       => 'Create permissions',
            'admin.permissions.update'       => 'Update permissions',
            'admin.permissions.delete'       => 'Delete permissions',
            'admin.resorts.view'             => 'View resorts',
            'admin.resorts.create'           => 'Create resorts',
            'admin.resorts.update'           => 'Update resorts',
            'admin.resorts.delete'           => 'Delete resorts',
            'admin.restaurand.view'          => 'View manage restaurant',
            'admin.restaurand.create'        => 'Create restaurant',
            'admin.restaurand.update'        => 'Update restaurant',
            'admin.restaurand.delete'        => 'Delete restaurant',
            'admin.reports.view'             => 'View reports',
            'admin.activity_logs.view'       => 'View activity logs',

            // ── Payments (cross-domain) ────────────────────────────────
            'payments.view'                  => 'View payment details and receipts',
            'payments.print'                 => 'Print payment receipt',
            'payments.pdf'                   => 'Generate and download payment PDF',
            'payments.refund'                => 'Process payment refunds',

            // ── Resort ─────────────────────────────────────────────────
            'resort.dashboard.view'          => 'View resort dashboard',
            'resort.staff.view'              => 'View resort staff',
            'resort.staff.create'            => 'Create resort staff',
            'resort.staff.update'            => 'Update resort staff',
            'resort.staff.delete'            => 'Delete resort staff',
            'resort.rooms.view'              => 'View rooms',
            'resort.rooms.create'            => 'Create rooms',
            'resort.rooms.update'            => 'Update rooms',
            'resort.rooms.delete'            => 'Delete rooms',
            'resort.bookings.view'           => 'View bookings',
            'resort.bookings.create'         => 'Create bookings',
            'resort.bookings.update'         => 'Update bookings',
            'resort.bookings.delete'         => 'Delete bookings',
            'resort.guests.view'             => 'View guests',
            'resort.guests.create'           => 'Create guests',
            'resort.guests.update'           => 'Update guests',
            'resort.checkin.manage'          => 'Manage check-in',
            'resort.checkout.manage'         => 'Manage check-out',
            'resort.payments.view'           => 'View resort payments',
            'resort.payments.create'         => 'Create resort payments',
            'resort.invoices.view'           => 'View resort invoices',
            'resort.facilities.view'         => 'View facilities',
            'resort.facilities.manage'       => 'Manage facilities',
            'resort.branches.view'           => 'View branches',
            'resort.branches.manage'         => 'Manage branches',

            // ── Restaurant ─────────────────────────────────────────────
            'restaurant.dashboard.view'      => 'View restaurant dashboard',
            'restaurant.staff.view'          => 'View restaurant staff',
            'restaurant.staff.create'        => 'Create restaurant staff',
            'restaurant.staff.update'        => 'Update restaurant staff',
            'restaurant.staff.delete'        => 'Delete restaurant staff',
            'restaurant.menu.view'           => 'View menu',
            'restaurant.menu.manage'         => 'Manage menu',
            'restaurant.categories.view'     => 'View food categories',
            'restaurant.categories.manage'   => 'Manage food categories',
            'restaurant.tables.view'         => 'View tables',
            'restaurant.tables.manage'       => 'Manage tables',
            'restaurant.reservations.view'   => 'View table reservations',
            'restaurant.reservations.manage' => 'Manage table reservations',
            'restaurant.orders.view'         => 'View food orders',
            'restaurant.orders.create'       => 'Create food orders',
            'restaurant.orders.update'       => 'Update food orders',
            'restaurant.orders.delete'       => 'Delete food orders',
            'restaurant.billing.view'        => 'View restaurant billing',
            'restaurant.billing.manage'      => 'Manage restaurant billing',
            'restaurant.payments.view'       => 'View restaurant payments',
        ];

        foreach ($permissions as $name => $description) {
            Permission::firstOrCreate(['name' => $name], ['description' => $description]);
        }
    }
}
