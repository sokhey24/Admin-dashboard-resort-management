<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 1 — Migration 02
 *
 * Problems fixed:
 * DB-03: bookings table is missing critical operational columns required for:
 *   - Guest linking (guest_id FK to guests table)
 *   - Proper date tracking (check_in / check_out are booking intent dates;
 *     checked_in_at / checked_out_at record actual operations)
 *   - Billing (tax_amount, service_charge_amount)
 *   - Night calculation (stored for reporting)
 *   - Status timestamps (confirmed_at, checked_in_at, checked_out_at, completed_at)
 *   - Cancellation audit trail (cancelled_at, cancelled_by, cancellation_reason)
 *   - Booking source tracking (walk_in, website, phone, ota, staff)
 *   - Staff notes (internal_notes — separate from guest special_requests)
 *   - Soft delete (cancelled bookings must be retained for reporting)
 *
 * WF-01: BookingService forces check_in = now(). Adding proper date columns
 *        clarifies the separation: check_in/check_out = intended dates (set at
 *        reservation time), checked_in_at/checked_out_at = actual timestamps.
 *
 * NOTE: check_in and check_out already exist as datetime columns (migration
 *       2026_08_20). We only ADD the new columns here — no modification to existing.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            // Guest FK — links to the guests table (separate from users)
            // Nullable because legacy bookings only have user_id
            $table->foreignId('guest_id')
                  ->nullable()
                  ->after('user_id')
                  ->constrained('guests')
                  ->nullOnDelete();

            // Booking source — how was this booking made?
            $table->enum('source', ['walk_in', 'website', 'phone', 'ota', 'staff'])
                  ->default('staff')
                  ->after('booking_code');

            // Computed night count — stored for reporting performance
            $table->unsignedSmallInteger('nights')->default(0)->after('children');

            // Financial breakdown — backend calculated, never from frontend
            $table->decimal('tax_amount', 12, 2)->default(0)->after('discount');
            $table->decimal('service_charge_amount', 12, 2)->default(0)->after('tax_amount');

            // Deposit and balance tracking
            $table->decimal('deposit_amount', 12, 2)->default(0)->after('total_amount');
            $table->decimal('balance_due', 12, 2)->default(0)->after('deposit_amount');

            // Actual operation timestamps — different from check_in/check_out dates
            $table->timestamp('confirmed_at')->nullable()->after('status');
            $table->timestamp('checked_in_at')->nullable()->after('confirmed_at');
            $table->timestamp('checked_out_at')->nullable()->after('checked_in_at');
            $table->timestamp('completed_at')->nullable()->after('checked_out_at');

            // Cancellation audit trail
            $table->timestamp('cancelled_at')->nullable()->after('completed_at');
            $table->foreignId('cancelled_by')
                  ->nullable()
                  ->after('cancelled_at')
                  ->constrained('users')
                  ->nullOnDelete();
            $table->text('cancellation_reason')->nullable()->after('cancelled_by');

            // Staff-only internal notes (not visible to guest)
            $table->text('internal_notes')->nullable()->after('special_requests');

            // Who created this booking
            $table->foreignId('created_by')
                  ->nullable()
                  ->after('internal_notes')
                  ->constrained('users')
                  ->nullOnDelete();

            // Soft delete — cancelled/completed bookings must be retained
            $table->softDeletes();

            // Indexes for common queries
            $table->index(['resort_id', 'status'], 'bookings_resort_status_idx');
            $table->index(['resort_id', 'check_in'], 'bookings_resort_checkin_idx');
            $table->index('guest_id', 'bookings_guest_id_idx');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            // Drop indexes first
            $table->dropIndex('bookings_resort_status_idx');
            $table->dropIndex('bookings_resort_checkin_idx');
            $table->dropIndex('bookings_guest_id_idx');

            // Drop foreign keys
            $table->dropForeign(['guest_id']);
            $table->dropForeign(['cancelled_by']);
            $table->dropForeign(['created_by']);

            // Drop columns
            $table->dropColumn([
                'guest_id', 'source', 'nights',
                'tax_amount', 'service_charge_amount',
                'deposit_amount', 'balance_due',
                'confirmed_at', 'checked_in_at', 'checked_out_at', 'completed_at',
                'cancelled_at', 'cancelled_by', 'cancellation_reason',
                'internal_notes', 'created_by',
            ]);

            $table->dropSoftDeletes();
        });
    }
};
