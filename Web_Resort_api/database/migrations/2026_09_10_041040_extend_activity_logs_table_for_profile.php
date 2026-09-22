<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('activity_logs')) {
            return;
        }

        Schema::table('activity_logs', function (Blueprint $table) {
            if (!Schema::hasColumn('activity_logs', 'changes')) {
                $table->json('changes')->nullable()->after('description');
            }
            if (!Schema::hasColumn('activity_logs', 'user_agent')) {
                $table->text('user_agent')->nullable();
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('activity_logs')) {
            return;
        }

        Schema::table('activity_logs', function (Blueprint $table) {
            $drop = [];
            if (Schema::hasColumn('activity_logs', 'changes')) {
                $drop[] = 'changes';
            }
            if (Schema::hasColumn('activity_logs', 'user_agent')) {
                $drop[] = 'user_agent';
            }
            if ($drop) {
                $table->dropColumn($drop);
            }
        });
    }
};
