<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_resort', function (Blueprint $table) {
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('resort_id')->constrained('resorts')->cascadeOnDelete();
            $table->string('role')->nullable(); // e.g. 'manager', 'receptionist'
            $table->boolean('is_primary')->default(false);
            $table->timestamp('assigned_at')->nullable();

            $table->primary(['user_id', 'resort_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_resort');
    }
};
