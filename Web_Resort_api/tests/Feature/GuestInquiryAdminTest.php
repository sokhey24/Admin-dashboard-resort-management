<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\ContactInquiry;
use App\Models\Permission;
use App\Models\Resort;
use App\Models\Role;
use App\Models\ServiceInquiry;
use App\Models\User;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GuestInquiryAdminTest extends TestCase
{
    protected Resort $resort;

    protected Branch $branchA;

    protected Branch $branchB;

    protected User $staffA;

    protected function setUp(): void
    {
        parent::setUp();

        $this->resort = Resort::create([
            'name' => 'Solara', 'slug' => 'solara',
            'address' => 'Coastal Road', 'city' => 'Sihanoukville',
        ]);

        $this->branchA = Branch::create([
            'resort_id' => $this->resort->id,
            'name' => 'Solara Koh Rong',
            'address' => 'Koh Rong',
            'status' => 'active',
        ]);

        $this->branchB = Branch::create([
            'resort_id' => $this->resort->id,
            'name' => 'Solara Siem Reap',
            'address' => 'Siem Reap',
            'status' => 'active',
        ]);

        $role = Role::create(['name' => 'resort_staff', 'display_name' => 'Resort Staff']);
        $view = Permission::create(['name' => 'resort.guests.view', 'description' => 'View guests']);
        $update = Permission::create(['name' => 'resort.guests.update', 'description' => 'Update guests']);
        $role->permissions()->attach([$view->id, $update->id]);

        $this->staffA = User::create([
            'name' => 'Staff A', 'email' => 'staffa@example.com', 'password' => bcrypt('secret'),
        ]);
        $this->staffA->roles()->attach($role->id);
        $this->staffA->branches()->attach($this->branchA->id, [
            'role' => 'staff',
            'is_primary' => true,
            'assigned_at' => now(),
        ]);
    }

    public function test_staff_sees_only_service_inquiries_for_assigned_branch(): void
    {
        ServiceInquiry::create([
            'service_title' => 'Spa',
            'preferred_date' => now()->addDay(),
            'resort_name' => 'Solara Koh Rong',
            'guest_count' => 2,
            'guest_name' => 'Guest A',
            'guest_email' => 'a@example.com',
            'guest_phone' => '+855111',
            'status' => 'pending',
        ]);

        ServiceInquiry::create([
            'service_title' => 'Spa',
            'preferred_date' => now()->addDay(),
            'resort_name' => 'Solara Siem Reap',
            'guest_count' => 1,
            'guest_name' => 'Guest B',
            'guest_email' => 'b@example.com',
            'guest_phone' => '+855222',
            'status' => 'pending',
        ]);

        Sanctum::actingAs($this->staffA);

        $response = $this->getJson('/api/admin/service-inquiries');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertSame('Solara Koh Rong', $response->json('data.0.resort_name'));
    }

    public function test_staff_cannot_view_contact_inquiry_from_other_branch(): void
    {
        $inquiry = ContactInquiry::create([
            'guest_name' => 'Guest B',
            'guest_email' => 'b@example.com',
            'guest_phone' => '+855222',
            'resort_name' => 'Solara Siem Reap',
            'subject' => 'general',
            'message' => 'Hello',
            'status' => 'pending',
        ]);

        Sanctum::actingAs($this->staffA);

        $this->getJson('/api/admin/contact-inquiries/'.$inquiry->id)
            ->assertForbidden();
    }

    public function test_staff_can_update_status_for_own_branch_contact_inquiry(): void
    {
        $inquiry = ContactInquiry::create([
            'guest_name' => 'Guest A',
            'guest_email' => 'a@example.com',
            'guest_phone' => '+855111',
            'resort_name' => 'Solara Koh Rong',
            'subject' => 'general',
            'message' => 'Hello',
            'status' => 'pending',
        ]);

        Sanctum::actingAs($this->staffA);

        $this->patchJson('/api/admin/contact-inquiries/'.$inquiry->id, ['status' => 'confirmed'])
            ->assertOk()
            ->assertJsonPath('data.status', 'confirmed');
    }

    public function test_unauthenticated_user_cannot_list_guest_inquiries(): void
    {
        $this->getJson('/api/admin/contact-inquiries')->assertUnauthorized();
    }
}
