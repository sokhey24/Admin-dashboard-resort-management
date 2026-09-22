<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            // Human-readable payment ID (PAY-001)
            $table->string('payment_id', 32)->nullable()->unique()->after('id');

            // Polymorphic source: 'resort' | 'restaurant'
            $table->string('source', 20)->nullable()->after('payment_id');
            $table->string('reference_type')->nullable()->after('source');
            $table->unsignedBigInteger('reference_id')->nullable()->after('reference_type');

            // Extended payment fields
            $table->string('payment_method', 50)->nullable()->after('method');
            $table->string('gateway', 50)->nullable()->after('payment_method');
            $table->string('payment_reference', 100)->nullable()->after('gateway');
            $table->string('currency', 10)->default('USD')->after('payment_reference');
            $table->string('card_last4', 4)->nullable()->after('currency');

            // Breakdown — calculated on backend, stored for audit
            $table->decimal('subtotal', 10, 2)->default(0)->after('amount');
            $table->decimal('discount', 10, 2)->default(0)->after('subtotal');
            $table->decimal('tax', 10, 2)->default(0)->after('discount');
            $table->decimal('service_charge', 10, 2)->default(0)->after('tax');
            $table->decimal('paid_amount', 10, 2)->default(0)->after('service_charge');
            $table->decimal('balance', 10, 2)->default(0)->after('paid_amount');
            $table->decimal('refund_amount', 10, 2)->default(0)->after('balance');

            $table->timestamp('refunded_at')->nullable()->after('paid_at');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
            $table->dropForeign(['updated_by']);
            $table->dropColumn([
                'payment_id', 'source', 'reference_type', 'reference_id',
                'payment_method', 'gateway', 'payment_reference', 'currency', 'card_last4',
                'subtotal', 'discount', 'tax', 'service_charge',
                'paid_amount', 'balance', 'refund_amount', 'refunded_at',
                'created_by', 'updated_by',
            ]);
        });
    }
};
