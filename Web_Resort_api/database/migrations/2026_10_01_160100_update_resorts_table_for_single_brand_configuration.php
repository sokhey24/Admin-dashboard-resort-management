<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Treat `resorts` as the single company/brand configuration and add global brand assets.
     */
    public function up(): void
    {
        Schema::table('resorts', function (Blueprint $table) {
            if (! Schema::hasColumn('resorts', 'brand_name')) {
                $table->string('brand_name')->nullable()->after('name');
            }
            if (! Schema::hasColumn('resorts', 'favicon')) {
                $table->string('favicon')->nullable()->after('logo');
            }
            if (! Schema::hasColumn('resorts', 'central_phone')) {
                $table->string('central_phone')->nullable()->after('phone');
            }
            if (! Schema::hasColumn('resorts', 'central_email')) {
                $table->string('central_email')->nullable()->after('email');
            }
            if (! Schema::hasColumn('resorts', 'terms_and_conditions')) {
                $table->longText('terms_and_conditions')->nullable()->after('status');
            }
        });

        // Backfill existing data for single brand identity
        if (Schema::hasColumn('resorts', 'brand_name') && Schema::hasColumn('resorts', 'name')) {
            DB::table('resorts')
                ->whereNull('brand_name')
                ->orWhere('brand_name', '')
                ->update(['brand_name' => DB::raw('name')]);
        }

        if (Schema::hasColumn('resorts', 'central_phone') && Schema::hasColumn('resorts', 'phone')) {
            DB::table('resorts')
                ->whereNull('central_phone')
                ->whereNotNull('phone')
                ->update(['central_phone' => DB::raw('phone')]);
        }

        if (Schema::hasColumn('resorts', 'central_email') && Schema::hasColumn('resorts', 'email')) {
            DB::table('resorts')
                ->whereNull('central_email')
                ->whereNotNull('email')
                ->update(['central_email' => DB::raw('email')]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('resorts', function (Blueprint $table) {
            $columnsToDrop = [];
            foreach (['brand_name', 'favicon', 'central_phone', 'central_email', 'terms_and_conditions'] as $col) {
                if (Schema::hasColumn('resorts', $col)) {
                    $columnsToDrop[] = $col;
                }
            }

            if (! empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};
