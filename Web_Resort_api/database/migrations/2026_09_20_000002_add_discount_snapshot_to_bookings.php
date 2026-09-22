<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Historical price/discount snapshot.
 *
 * booking_rooms.subtotal keeps its existing gross meaning (price_per_night ×
 * nights) so existing readers stay correct; the discounted figure lives in
 * net_subtotal. bookings.room_discount_total keeps the room discount separable
 * from any coupon discount, both of which are summed into bookings.discount.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('booking_rooms', function (Blueprint $table) {
            $table->decimal('discount_percent', 5, 2)->default(0)->after('nights');
            $table->decimal('discount_amount', 10, 2)->default(0)->after('discount_percent');
            $table->decimal('net_subtotal', 10, 2)->default(0)->after('subtotal');
        });

        Schema::table('bookings', function (Blueprint $table) {
            $table->decimal('room_discount_total', 12, 2)->default(0)->after('discount');
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->decimal('discount', 10, 2)->default(0)->after('amount');
            $table->decimal('service_charge', 10, 2)->default(0)->after('tax');
        });
    }

    public function down(): void
    {
        Schema::table('booking_rooms', function (Blueprint $table) {
            $table->dropColumn(['discount_percent', 'discount_amount', 'net_subtotal']);
        });

        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn('room_discount_total');
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn(['discount', 'service_charge']);
        });
    }
};
