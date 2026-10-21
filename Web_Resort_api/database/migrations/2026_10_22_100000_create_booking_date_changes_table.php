<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('booking_date_changes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained()->cascadeOnDelete();
            $table->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->date('previous_check_in');
            $table->date('previous_check_out');
            $table->date('new_check_in');
            $table->date('new_check_out');
            $table->decimal('previous_total', 14, 2);
            $table->decimal('new_total', 14, 2);
            $table->decimal('price_difference', 14, 2)->default(0);
            $table->string('currency', 3)->default('USD');
            $table->string('reason', 500)->nullable();
            $table->string('source', 32)->default('guest');
            $table->timestamps();

            $table->index(['booking_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('booking_date_changes');
    }
};
