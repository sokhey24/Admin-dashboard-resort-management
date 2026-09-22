<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            if (! Schema::hasColumn('reviews', 'room_id')) {
                $table->foreignId('room_id')->nullable()->after('user_id')->constrained('rooms')->nullOnDelete();
            }
            if (! Schema::hasColumn('reviews', 'title')) {
                $table->string('title', 180)->nullable()->after('rating');
            }
        });

        if (Schema::hasColumn('reviews', 'booking_id')) {
            Schema::table('reviews', function (Blueprint $table) {
                $table->unsignedBigInteger('booking_id')->nullable()->change();
            });
        }
    }

    public function down(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            if (Schema::hasColumn('reviews', 'title')) {
                $table->dropColumn('title');
            }
            if (Schema::hasColumn('reviews', 'room_id')) {
                $table->dropConstrainedForeignId('room_id');
            }
        });
    }
};
