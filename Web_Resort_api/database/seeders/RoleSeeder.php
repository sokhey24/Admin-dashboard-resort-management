<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            ['name' => 'admin',              'display_name' => 'Admin',                 'description' => 'Full system access'],
            ['name' => 'resort_manager',     'display_name' => 'Resort Management',     'description' => 'Manage resort operations and staff'],
            ['name' => 'restaurant_manager', 'display_name' => 'Restaurant Management', 'description' => 'Manage restaurant operations and staff'],
            ['name' => 'resort_staff',       'display_name' => 'Resort Staff',          'description' => 'Resort operational staff'],
            ['name' => 'restaurant_staff',   'display_name' => 'Restaurant Staff',      'description' => 'Restaurant operational staff'],
            ['name' => 'customer',           'display_name' => 'Customer',              'description' => 'Regular customer'],
        ];

        foreach ($roles as $data) {
            Role::firstOrCreate(['name' => $data['name']], [
                'display_name' => $data['display_name'],
                'description'  => $data['description'],
            ]);
        }

        // Admin — full access to everything
        $this->sync('admin', [
            'admin.dashboard.view',
            'admin.users.view',       'admin.users.create',       'admin.users.update',       'admin.users.delete',
            'admin.roles.view',       'admin.roles.create',       'admin.roles.update',       'admin.roles.delete',
            'admin.permissions.view', 'admin.permissions.create', 'admin.permissions.update', 'admin.permissions.delete',
            'admin.resorts.view',     'admin.resorts.create',     'admin.resorts.update',     'admin.resorts.delete',
            'admin.restaurand.view',  'admin.restaurand.create',  'admin.restaurand.update',  'admin.restaurand.delete',
            'admin.reports.view',     'admin.activity_logs.view',
            // Payment permissions
            'payments.view',          'payments.print',           'payments.pdf',             'payments.refund',
            'resort.dashboard.view',
            'resort.staff.view',      'resort.staff.create',      'resort.staff.update',      'resort.staff.delete',
            'resort.rooms.view',      'resort.rooms.create',      'resort.rooms.update',      'resort.rooms.delete',
            'resort.bookings.view',   'resort.bookings.create',   'resort.bookings.update',   'resort.bookings.delete',
            'resort.guests.view',     'resort.guests.create',     'resort.guests.update',
            'resort.checkin.manage',  'resort.checkout.manage',
            'resort.payments.view',   'resort.payments.create',   'resort.invoices.view',
            'resort.facilities.view', 'resort.facilities.manage',
            'resort.branches.view',   'resort.branches.manage',
            'restaurant.dashboard.view',
            'restaurant.staff.view',  'restaurant.staff.create',  'restaurant.staff.update',  'restaurant.staff.delete',
            'restaurant.menu.view',   'restaurant.menu.manage',
            'restaurant.categories.view', 'restaurant.categories.manage',
            'restaurant.tables.view', 'restaurant.tables.manage',
            'restaurant.reservations.view', 'restaurant.reservations.manage',
            'restaurant.orders.view', 'restaurant.orders.create', 'restaurant.orders.update', 'restaurant.orders.delete',
            'restaurant.billing.view', 'restaurant.billing.manage',
            'restaurant.payments.view',
        ]);

        // Resort Management
        $this->sync('resort_manager', [
            'resort.dashboard.view',
            'resort.staff.view',      'resort.staff.create',      'resort.staff.update',      'resort.staff.delete',
            'resort.rooms.view',      'resort.rooms.create',      'resort.rooms.update',      'resort.rooms.delete',
            'resort.bookings.view',   'resort.bookings.create',   'resort.bookings.update',   'resort.bookings.delete',
            'resort.guests.view',     'resort.guests.create',     'resort.guests.update',
            'resort.checkin.manage',  'resort.checkout.manage',
            'resort.payments.view',   'resort.payments.create',   'resort.invoices.view',
            'resort.facilities.view', 'resort.facilities.manage',
            'resort.branches.view',   'resort.branches.manage',
            // Payment permissions — managers can view, print and generate PDFs, but NOT refund
            'payments.view',          'payments.print',           'payments.pdf',
        ]);

        // Restaurant Management
        $this->sync('restaurant_manager', [
            'restaurant.dashboard.view',
            'restaurant.staff.view',  'restaurant.staff.create',  'restaurant.staff.update',  'restaurant.staff.delete',
            'restaurant.menu.view',   'restaurant.menu.manage',
            'restaurant.categories.view', 'restaurant.categories.manage',
            'restaurant.tables.view', 'restaurant.tables.manage',
            'restaurant.reservations.view', 'restaurant.reservations.manage',
            'restaurant.orders.view', 'restaurant.orders.create', 'restaurant.orders.update', 'restaurant.orders.delete',
            'restaurant.billing.view', 'restaurant.billing.manage',
            'restaurant.payments.view',
            // Payment permissions — managers can view, print and generate PDFs, but NOT refund
            'payments.view',          'payments.print',           'payments.pdf',
        ]);

        // Resort Staff — limited operational access only
        $this->sync('resort_staff', [
            'resort.dashboard.view',
            'resort.staff.view',
            'resort.rooms.view',
            'resort.bookings.view',
            'resort.guests.view',
            'resort.checkin.manage',
            'resort.checkout.manage',
            'resort.payments.view',
            'resort.payments.create',
            'resort.invoices.view',
            'payments.view',

        // Restaurant Staff — limited operational access only
        $this->sync('restaurant_staff', [
            'restaurant.dashboard.view',
            'restaurant.staff.view',
            'restaurant.menu.view',
            'restaurant.categories.view',
            'restaurant.tables.view',
            'restaurant.reservations.view',
            'restaurant.orders.view',   'restaurant.orders.create', 'restaurant.orders.update',
            'restaurant.billing.view',
        ]);
    }

    private function sync(string $roleName, array $permissionNames): void
    {
        $role = Role::where('name', $roleName)->first();
        if (!$role) return;
        $ids = Permission::whereIn('name', $permissionNames)->pluck('id');
        $role->permissions()->syncWithoutDetaching($ids);
    }
}
