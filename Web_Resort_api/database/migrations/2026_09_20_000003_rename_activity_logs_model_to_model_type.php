<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Older installs carry activity_logs.model while the create migration declares
 * model_type, so application code that writes model_type fails there. Bring the
 * drifted databases back in line with the migrations.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('activity_logs')) {
            return;
        }

        if (Schema::hasColumn('activity_logs', 'model_type') || ! Schema::hasColumn('activity_logs', 'model')) {
            return;
        }

        Schema::table('activity_logs', function (Blueprint $table) {
            $table->renameColumn('model', 'model_type');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('activity_logs')) {
            return;
        }

        if (Schema::hasColumn('activity_logs', 'model') || ! Schema::hasColumn('activity_logs', 'model_type')) {
            return;
        }

        Schema::table('activity_logs', function (Blueprint $table) {
            $table->renameColumn('model_type', 'model');
        });
    }
};
