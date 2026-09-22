<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Percentage room discount (0–100).
 *
 * room_types.discount_percent is the campaign default for the sellable product.
 * rooms.discount_percent is an optional per-unit override where NULL means
 * "inherit the room type", mirroring how rooms.price_per_night already overrides
 * room_types.base_price.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('room_types', function (Blueprint $table) {
            $table->decimal('discount_percent', 5, 2)->default(0)->after('base_price');
        });

        Schema::table('rooms', function (Blueprint $table) {
            $table->decimal('discount_percent', 5, 2)->nullable()->after('price_per_night');
        });
    }

    public function down(): void
    {
        Schema::table('room_types', function (Blueprint $table) {
            $table->dropColumn('discount_percent');
        });

        Schema::table('rooms', function (Blueprint $table) {
            $table->dropColumn('discount_percent');
        });
    }
};
