<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('food_orders', function (Blueprint $table) {
            $table->string('fulfillment_type', 32)->default('dine_in')->after('booking_id');
            $table->string('payment_method', 32)->nullable()->after('fulfillment_type');
            $table->decimal('service_charge', 10, 2)->default(0)->after('tax');
            $table->string('client_request_id', 64)->nullable()->unique()->after('order_code');
        });

        Schema::table('food_order_items', function (Blueprint $table) {
            $table->string('item_name')->nullable()->after('menu_item_id');
        });
    }

    public function down(): void
    {
        Schema::table('food_order_items', function (Blueprint $table) {
            $table->dropColumn('item_name');
        });

        Schema::table('food_orders', function (Blueprint $table) {
            $table->dropColumn(['fulfillment_type', 'payment_method', 'service_charge', 'client_request_id']);
        });
    }
};
