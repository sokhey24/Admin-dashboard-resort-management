<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('restaurant_tables', function (Blueprint $table) {
            $table->id();
            $table->foreignId('resort_id')->constrained('resorts')->cascadeOnDelete();
            $table->string('table_number', 20)->unique();
            $table->integer('capacity')->default(4);
            $table->string('location')->nullable();
            $table->enum('status', ['available', 'occupied', 'reserved', 'maintenance'])->default('available');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('restaurant_tables');
    }
};
