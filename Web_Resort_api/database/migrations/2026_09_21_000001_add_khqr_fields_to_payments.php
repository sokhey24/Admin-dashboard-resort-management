<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->string('khqr_md5', 32)->nullable()->unique()->after('transaction_ref');
            $table->text('qr_payload')->nullable()->after('khqr_md5');
            $table->string('bakong_hash', 128)->nullable()->after('qr_payload');
            $table->timestamp('expires_at')->nullable()->after('bakong_hash');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn(['khqr_md5', 'qr_payload', 'bakong_hash', 'expires_at']);
        });
    }
};
