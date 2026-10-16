<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            if (! Schema::hasColumn('branches', 'description')) {
                $table->text('description')->nullable()->after('address');
            }
            if (! Schema::hasColumn('branches', 'description_km')) {
                $table->text('description_km')->nullable()->after('address');
            }
        });
    }

    public function down(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            $drops = [];
            if (Schema::hasColumn('branches', 'description_km')) {
                $drops[] = 'description_km';
            }
            if (Schema::hasColumn('branches', 'description') && ! Schema::hasColumn('branches', 'description_km')) {
                $drops[] = 'description';
            }
            if ($drops !== []) {
                $table->dropColumn($drops);
            }
        });
    }
};
