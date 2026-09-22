<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('guest_folios', function (Blueprint $table) {
            $table->id();
            $table->string('folio_number')->unique();
            $table->foreignId('booking_id')->constrained('bookings')->cascadeOnDelete();
            $table->foreignId('guest_id')->constrained('guests')->cascadeOnDelete();
            $table->foreignId('resort_id')->constrained('resorts')->cascadeOnDelete();
            $table->enum('charge_type', [
                'room',
                'restaurant',
                'service',
                'tax',
                'discount',
                'deposit',
                'adjustment',
            ]);
            $table->string('description');
            $table->decimal('quantity', 8, 2)->default(1);
            $table->decimal('unit_price', 10, 2)->default(0);
            $table->decimal('amount', 10, 2); // can be negative for credits/discounts
            $table->string('reference_type')->nullable(); // polymorphic morph type
            $table->unsignedBigInteger('reference_id')->nullable(); // polymorphic morph id
            $table->foreignId('posted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('posted_at')->nullable();
            $table->text('note')->nullable();
            $table->timestamps();

            $table->index(['reference_type', 'reference_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('guest_folios');
    }
};
