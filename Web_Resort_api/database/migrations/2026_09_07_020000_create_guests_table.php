<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('guests', function (Blueprint $table) {
            $table->id();
            $table->string('guest_code')->unique(); // e.g. GST-001
            $table->string('first_name');
            $table->string('last_name');
            $table->string('email')->nullable()->unique();
            $table->string('phone')->nullable();
            $table->string('nationality')->nullable();
            $table->string('passport_number')->nullable();
            $table->date('date_of_birth')->nullable();
            $table->enum('gender', ['male', 'female', 'other'])->nullable();
            $table->text('address')->nullable();
            $table->string('city')->nullable();
            $table->string('country')->nullable();
            $table->enum('id_type', ['passport', 'national_id', 'driving_license'])->nullable();
            $table->string('id_number')->nullable();
            $table->enum('vip_level', ['standard', 'silver', 'gold', 'platinum'])->default('standard');
            $table->unsignedInteger('total_stays')->default(0);
            $table->decimal('total_spent', 10, 2)->default(0);
            $table->text('notes')->nullable();
            $table->enum('status', ['active', 'blacklisted'])->default('active');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('guests');
    }
};
