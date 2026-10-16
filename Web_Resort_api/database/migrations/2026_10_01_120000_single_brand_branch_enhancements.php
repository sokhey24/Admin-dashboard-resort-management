<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            if (! Schema::hasColumn('branches', 'city')) {
                $table->string('city')->nullable()->after('name');
            }
            if (! Schema::hasColumn('branches', 'email')) {
                $table->string('email')->nullable()->after('phone');
            }
            if (! Schema::hasColumn('branches', 'cover_image')) {
                $table->string('cover_image')->nullable()->after('email');
            }
            if (! Schema::hasColumn('branches', 'latitude')) {
                $table->decimal('latitude', 10, 7)->nullable()->after('cover_image');
            }
            if (! Schema::hasColumn('branches', 'longitude')) {
                $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            }
            if (! Schema::hasColumn('branches', 'stars')) {
                $table->unsignedTinyInteger('stars')->nullable()->after('longitude');
            }
            if (! Schema::hasColumn('branches', 'slug')) {
                $table->string('slug')->nullable()->after('name');
            }
        });

        if (Schema::hasColumn('branches', 'status') && DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE branches MODIFY status ENUM('active', 'inactive', 'maintenance') NOT NULL DEFAULT 'active'");
        }

        if (! Schema::hasTable('user_branch')) {
            Schema::create('user_branch', function (Blueprint $table) {
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
                $table->string('role')->nullable();
                $table->boolean('is_primary')->default(false);
                $table->timestamp('assigned_at')->nullable();
                $table->primary(['user_id', 'branch_id']);
            });
        }

        foreach (['bookings', 'room_types', 'restaurants', 'food_categories', 'restaurant_tables', 'food_orders'] as $tableName) {
            if (Schema::hasTable($tableName) && ! Schema::hasColumn($tableName, 'branch_id')) {
                Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                    $col = $table->foreignId('branch_id')->nullable();
                    if (Schema::hasColumn($tableName, 'resort_id')) {
                        $col->after('resort_id');
                    }
                    $col->constrained('branches')->nullOnDelete();
                });
            }
        }

        if (Schema::hasTable('user_resort') && Schema::hasTable('user_branch')) {
            $rows = DB::table('user_resort')->get();
            foreach ($rows as $row) {
                $branchIds = DB::table('branches')
                    ->where('resort_id', $row->resort_id)
                    ->pluck('id');
                foreach ($branchIds as $branchId) {
                    DB::table('user_branch')->insertOrIgnore([
                        'user_id' => $row->user_id,
                        'branch_id' => $branchId,
                        'role' => $row->role,
                        'is_primary' => (bool) $row->is_primary,
                        'assigned_at' => $row->assigned_at,
                    ]);
                }
            }
        }

        if (Schema::hasColumn('branches', 'city') && DB::getDriverName() === 'mysql') {
            DB::table('branches')
                ->where(function ($q) {
                    $q->whereNull('city')->orWhere('city', '');
                })
                ->update(['city' => DB::raw("TRIM(SUBSTRING_INDEX(name, ' ', -1))")]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('user_branch');

        foreach (['bookings', 'room_types', 'restaurants', 'food_categories', 'restaurant_tables', 'food_orders'] as $tableName) {
            if (Schema::hasTable($tableName) && Schema::hasColumn($tableName, 'branch_id')) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->dropConstrainedForeignId('branch_id');
                });
            }
        }

        Schema::table('branches', function (Blueprint $table) {
            foreach (['city', 'email', 'cover_image', 'latitude', 'longitude', 'stars', 'slug'] as $col) {
                if (Schema::hasColumn('branches', $col)) {
                    $table->dropColumn($col);
                }
            }
        });

        if (Schema::hasColumn('branches', 'status') && DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE branches MODIFY status ENUM('active', 'inactive') NOT NULL DEFAULT 'active'");
        }
    }
};
