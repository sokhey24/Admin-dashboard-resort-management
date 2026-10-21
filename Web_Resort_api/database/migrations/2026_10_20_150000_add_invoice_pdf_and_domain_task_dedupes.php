<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->string('pdf_disk')->nullable()->after('status');
            $table->string('pdf_path')->nullable()->after('pdf_disk');
            $table->timestamp('pdf_generated_at')->nullable()->after('pdf_path');
        });

        Schema::create('domain_task_dedupes', function (Blueprint $table) {
            $table->id();
            $table->string('task_key')->unique();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('domain_task_dedupes');

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn(['pdf_disk', 'pdf_path', 'pdf_generated_at']);
        });
    }
};
