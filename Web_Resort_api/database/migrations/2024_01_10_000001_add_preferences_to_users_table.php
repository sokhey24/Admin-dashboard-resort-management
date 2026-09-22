<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // This migration predates create_users_table by filename, so on a fresh
        // install the column is created there instead and this becomes a no-op.
        if (! Schema::hasTable('users') || Schema::hasColumn('users', 'preferences')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->json('preferences')->nullable()->after('profile_image');
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('users', 'preferences')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('preferences');
        });
    }
};
