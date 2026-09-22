<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('room_types', function (Blueprint $table) {
            $table->json('amenities')->nullable()->after('size_sqm');
            $table->boolean('breakfast_included')->default(false)->after('amenities');
            $table->boolean('free_cancellation')->default(true)->after('breakfast_included');
        });
    }

    public function down(): void
    {
        Schema::table('room_types', function (Blueprint $table) {
            $table->dropColumn(['amenities', 'breakfast_included', 'free_cancellation']);
        });
    }
};
