<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('password_reset_otps', function (Blueprint $table) {
            $table->unsignedTinyInteger('attempts')->default(0)->after('used');
            $table->timestamp('last_sent_at')->nullable()->after('attempts');
            $table->timestamp('verified_at')->nullable()->after('last_sent_at');
            $table->string('reset_token', 64)->nullable()->unique()->after('verified_at');
            $table->timestamp('reset_token_expires_at')->nullable()->after('reset_token');
        });
    }

    public function down(): void
    {
        Schema::table('password_reset_otps', function (Blueprint $table) {
            $table->dropColumn(['attempts', 'last_sent_at', 'verified_at', 'reset_token', 'reset_token_expires_at']);
        });
    }
};
