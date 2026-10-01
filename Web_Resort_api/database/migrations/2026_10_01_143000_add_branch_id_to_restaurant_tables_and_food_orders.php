<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('restaurant_tables') && ! Schema::hasColumn('restaurant_tables', 'branch_id')) {
            Schema::table('restaurant_tables', function (Blueprint $table) {
                $table->foreignId('branch_id')->nullable()->after('resort_id')->constrained('branches')->nullOnDelete();
            });
        }

        if (Schema::hasTable('food_orders') && ! Schema::hasColumn('food_orders', 'branch_id')) {
            Schema::table('food_orders', function (Blueprint $table) {
                $table->foreignId('branch_id')->nullable()->after('restaurant_table_id')->constrained('branches')->nullOnDelete();
            });
        }

        if (Schema::hasTable('restaurant_tables') && Schema::hasColumn('restaurant_tables', 'branch_id')) {
            DB::table('restaurant_tables')
                ->whereNull('branch_id')
                ->orderBy('id')
                ->chunkById(100, function ($rows) {
                    foreach ($rows as $row) {
                        $branchId = null;
                        if (! empty($row->resort_id)) {
                            $branchId = DB::table('branches')->where('resort_id', $row->resort_id)->orderBy('id')->value('id');
                        }
                        if ($branchId) {
                            DB::table('restaurant_tables')->where('id', $row->id)->update(['branch_id' => $branchId]);
                        }
                    }
                });
        }

        if (Schema::hasTable('food_orders') && Schema::hasColumn('food_orders', 'branch_id')) {
            DB::table('food_orders')
                ->whereNull('branch_id')
                ->orderBy('id')
                ->chunkById(100, function ($rows) {
                    foreach ($rows as $row) {
                        $branchId = null;
                        if (! empty($row->restaurant_table_id)) {
                            $branchId = DB::table('restaurant_tables')
                                ->where('id', $row->restaurant_table_id)
                                ->value('branch_id');
                        }
                        if ($branchId) {
                            DB::table('food_orders')->where('id', $row->id)->update(['branch_id' => $branchId]);
                        }
                    }
                });
        }
    }

    public function down(): void
    {
        foreach (['restaurant_tables', 'food_orders'] as $tableName) {
            if (! Schema::hasTable($tableName) || ! Schema::hasColumn($tableName, 'branch_id')) {
                continue;
            }

            Schema::table($tableName, function (Blueprint $table) {
                $table->dropConstrainedForeignId('branch_id');
            });
        }
    }
};
