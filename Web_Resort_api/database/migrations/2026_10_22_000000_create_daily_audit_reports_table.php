<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('daily_audit_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('resort_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->date('operational_date');
            $table->string('currency', 3)->default('USD');

            $table->unsignedInteger('total_rooms')->default(0);
            $table->unsignedInteger('sellable_rooms')->default(0);
            $table->unsignedInteger('occupied_rooms')->default(0);
            $table->unsignedInteger('maintenance_rooms')->default(0);
            $table->unsignedInteger('available_rooms')->default(0);
            $table->decimal('occupancy_rate', 6, 2)->default(0);

            $table->decimal('room_revenue', 14, 2)->default(0);
            $table->decimal('incidental_revenue', 14, 2)->default(0);
            $table->decimal('adr', 14, 2)->default(0);
            $table->decimal('revpar', 14, 2)->default(0);

            $table->unsignedInteger('arrivals')->default(0);
            $table->unsignedInteger('departures')->default(0);
            $table->unsignedInteger('no_show_count')->default(0);

            $table->string('status', 32)->default('pending');
            $table->text('error_message')->nullable();
            $table->json('metrics_meta')->nullable();
            $table->unsignedInteger('run_count')->default(0);
            $table->timestamp('generated_at')->nullable();
            $table->timestamps();

            $table->unique(['branch_id', 'operational_date']);
            $table->index(['resort_id', 'operational_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_audit_reports');
    }
};
