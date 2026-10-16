<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('room_types') || ! Schema::hasColumn('room_types', 'branch_id')) {
            return;
        }

        $indexName = 'room_types_branch_id_name_unique';
        if (Schema::hasIndex('room_types', $indexName)) {
            return;
        }

        Schema::table('room_types', function (Blueprint $table) use ($indexName) {
            $table->unique(['branch_id', 'name'], $indexName);
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('room_types')) {
            return;
        }

        Schema::table('room_types', function (Blueprint $table) {
            $table->dropUnique('room_types_branch_id_name_unique');
        });
    }
};
