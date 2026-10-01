<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Add operational columns to branches table.
     */
    public function up(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            if (! Schema::hasColumn('branches', 'address')) {
                $table->string('address', 500)->nullable()->after('name');
            }
            if (! Schema::hasColumn('branches', 'city')) {
                $table->string('city', 255)->nullable()->after('address');
            }
            if (! Schema::hasColumn('branches', 'province')) {
                $table->string('province', 255)->nullable()->after('city');
            }
            if (! Schema::hasColumn('branches', 'phone')) {
                $table->string('phone', 50)->nullable()->after('province');
            }
            if (! Schema::hasColumn('branches', 'email')) {
                $table->string('email', 255)->nullable()->after('phone');
            }
            if (! Schema::hasColumn('branches', 'cover_image')) {
                $table->string('cover_image', 500)->nullable()->after('email');
            }
            if (! Schema::hasColumn('branches', 'latitude')) {
                $table->decimal('latitude', 10, 7)->nullable()->after('cover_image');
            }
            if (! Schema::hasColumn('branches', 'longitude')) {
                $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            }
            if (! Schema::hasColumn('branches', 'checkin_time')) {
                $table->string('checkin_time', 10)->default('14:00')->after('status');
            }
            if (! Schema::hasColumn('branches', 'checkout_time')) {
                $table->string('checkout_time', 10)->default('12:00')->after('checkin_time');
            }
            if (! Schema::hasColumn('branches', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('checkout_time');
            }
        });

        // Synchronize is_active and province for existing branches
        if (Schema::hasColumn('branches', 'is_active') && Schema::hasColumn('branches', 'status')) {
            DB::statement("UPDATE branches SET is_active = CASE WHEN status = 'inactive' THEN 0 ELSE 1 END");
        }

        if (Schema::hasColumn('branches', 'province') && Schema::hasColumn('branches', 'city')) {
            DB::table('branches')
                ->whereNull('province')
                ->whereNotNull('city')
                ->update(['province' => DB::raw('city')]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            $columnsToDrop = [];
            foreach (['province', 'checkin_time', 'checkout_time', 'is_active'] as $col) {
                if (Schema::hasColumn('branches', $col)) {
                    $columnsToDrop[] = $col;
                }
            }

            if (! empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};
