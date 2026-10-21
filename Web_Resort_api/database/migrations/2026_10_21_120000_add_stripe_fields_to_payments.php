<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            if (! Schema::hasColumn('payments', 'stripe_payment_intent_id')) {
                $table->string('stripe_payment_intent_id', 255)->nullable()->unique()->after('expires_at');
            }
            if (! Schema::hasColumn('payments', 'card_brand')) {
                $table->string('card_brand', 32)->nullable()->after('card_last4');
            }
            if (! Schema::hasColumn('payments', 'client_request_id')) {
                $table->string('client_request_id', 128)->nullable()->unique()->after('transaction_ref');
            }
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $cols = array_filter([
                Schema::hasColumn('payments', 'stripe_payment_intent_id') ? 'stripe_payment_intent_id' : null,
                Schema::hasColumn('payments', 'card_brand') ? 'card_brand' : null,
                Schema::hasColumn('payments', 'client_request_id') ? 'client_request_id' : null,
            ]);
            if ($cols !== []) {
                $table->dropColumn($cols);
            }
        });
    }
};
