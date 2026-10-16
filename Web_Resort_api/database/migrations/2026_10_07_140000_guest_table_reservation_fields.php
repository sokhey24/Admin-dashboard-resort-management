<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('table_reservations', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropForeign(['restaurant_table_id']);
        });

        Schema::table('table_reservations', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable()->change();
            $table->unsignedBigInteger('restaurant_table_id')->nullable()->change();
            $table->string('guest_name', 150)->nullable()->after('restaurant_table_id');
            $table->string('guest_email', 150)->nullable()->after('guest_name');
            $table->string('guest_phone', 50)->nullable()->after('guest_email');
        });

        Schema::table('table_reservations', function (Blueprint $table) {
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
            $table->foreign('restaurant_table_id')->references('id')->on('restaurant_tables')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('table_reservations', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropForeign(['restaurant_table_id']);
        });

        Schema::table('table_reservations', function (Blueprint $table) {
            $table->dropColumn(['guest_name', 'guest_email', 'guest_phone']);
            $table->unsignedBigInteger('user_id')->nullable(false)->change();
            $table->unsignedBigInteger('restaurant_table_id')->nullable(false)->change();
        });

        Schema::table('table_reservations', function (Blueprint $table) {
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('restaurant_table_id')->references('id')->on('restaurant_tables')->cascadeOnDelete();
        });
    }
};
