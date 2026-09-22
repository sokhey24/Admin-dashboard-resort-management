<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('guests')) {
            return;
        }

        Schema::table('guests', function (Blueprint $table) {
            if (! Schema::hasColumn('guests', 'user_id')) {
                $table->foreignId('user_id')
                    ->nullable()
                    ->after('id')
                    ->constrained('users')
                    ->cascadeOnDelete();
                $table->unique('user_id');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('guests') || ! Schema::hasColumn('guests', 'user_id')) {
            return;
        }

        Schema::table('guests', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropUnique(['user_id']);
            $table->dropColumn('user_id');
        });
    }
};
