<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('md5', 32)->unique();
            $table->text('qr_payload');
            $table->decimal('amount', 10, 2);
            $table->string('currency', 3);
            $table->string('status', 20)->default('pending')->index();
            // Bakong's own transaction hash. Unique so one bank transaction can
            // never be used to settle two different payments.
            $table->string('bakong_hash')->nullable()->unique();
            $table->timestamp('expires_at');
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
