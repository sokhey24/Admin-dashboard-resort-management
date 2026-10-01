<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Ensure user_branch pivot table exists with required schema,
     * and verify branch_id references across operational entities (rooms, tables, bookings).
     */
    public function up(): void
    {
        // 1. Ensure user_branch pivot table exists
        if (! Schema::hasTable('user_branch')) {
            Schema::create('user_branch', function (Blueprint $table) {
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
                $table->string('role')->nullable();
                $table->boolean('is_primary')->default(false);
                $table->timestamp('assigned_at')->nullable();
                $table->primary(['user_id', 'branch_id']);
            });
        } else {
            Schema::table('user_branch', function (Blueprint $table) {
                if (! Schema::hasColumn('user_branch', 'role')) {
                    $table->string('role')->nullable();
                }
                if (! Schema::hasColumn('user_branch', 'is_primary')) {
                    $table->boolean('is_primary')->default(false);
                }
                if (! Schema::hasColumn('user_branch', 'assigned_at')) {
                    $table->timestamp('assigned_at')->nullable();
                }
            });
        }

        // 2. Resolve default active branch for fallback assignment
        $defaultBranchId = DB::table('branches')
            ->where(function ($q) {
                if (Schema::hasColumn('branches', 'is_active')) {
                    $q->where('is_active', true);
                }
                if (Schema::hasColumn('branches', 'status')) {
                    $q->orWhere('status', 'active');
                }
            })
            ->orderBy('id')
            ->value('id') ?? DB::table('branches')->orderBy('id')->value('id');

        // 3. Verify and backfill rooms.branch_id
        if (Schema::hasTable('rooms') && Schema::hasColumn('rooms', 'branch_id') && $defaultBranchId) {
            DB::table('rooms')
                ->whereNull('branch_id')
                ->update(['branch_id' => $defaultBranchId]);
        }

        // 4. Verify and backfill restaurant_tables.branch_id
        if (Schema::hasTable('restaurant_tables') && Schema::hasColumn('restaurant_tables', 'branch_id') && $defaultBranchId) {
            DB::table('restaurant_tables')
                ->whereNull('branch_id')
                ->update(['branch_id' => $defaultBranchId]);
        }

        // 5. Verify and backfill bookings.branch_id strictly from booked rooms
        if (Schema::hasTable('bookings') && Schema::hasColumn('bookings', 'branch_id')) {
            $unassignedBookings = DB::table('bookings')->whereNull('branch_id')->get(['id']);

            foreach ($unassignedBookings as $booking) {
                $resolvedBranchId = null;

                if (Schema::hasTable('booking_rooms') && Schema::hasTable('rooms')) {
                    $resolvedBranchId = DB::table('booking_rooms')
                        ->join('rooms', 'booking_rooms.room_id', '=', 'rooms.id')
                        ->where('booking_rooms.booking_id', $booking->id)
                        ->whereNotNull('rooms.branch_id')
                        ->value('rooms.branch_id');
                }

                $targetBranchId = $resolvedBranchId ?: $defaultBranchId;

                if ($targetBranchId) {
                    DB::table('bookings')
                        ->where('id', $booking->id)
                        ->update(['branch_id' => $targetBranchId]);
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Keep user_branch table intact if populated, or safely drop if created standalone
        if (Schema::hasTable('user_branch')) {
            // Note: Schema::dropIfExists('user_branch') would cascade-remove user assignments.
            // In dev rollback, we preserve schema safety.
        }
    }
};
