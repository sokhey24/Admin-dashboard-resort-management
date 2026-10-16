<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_bookings', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->string('activity_title', 200);
            $table->string('activity_id')->nullable();

            $table->date('booking_date');

            $table->unsignedInteger('guest_count')->default(1);

            $table->decimal('total_price', 10, 2);

            $table->string('guest_name', 150);
            $table->string('guest_email', 150);
            $table->string('guest_phone', 50);

            $table->text('special_requests')->nullable();

            $table->enum('status', ['pending', 'confirmed', 'cancelled'])->default('pending');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_bookings');
    }
};
