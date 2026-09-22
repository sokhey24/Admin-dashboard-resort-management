<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('booking_guests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained('bookings')->cascadeOnDelete();
            $table->foreignId('guest_id')->constrained('guests')->cascadeOnDelete();
            $table->boolean('is_primary')->default(false); // main registered guest
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('booking_guests');
    }
};
