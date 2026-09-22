<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 1 — Migration 01
 *
 * Problems fixed:
 * DB-01: rooms.status enum is missing dirty, cleaning, out_of_service
 *        The housekeeping workflow requires room → dirty → cleaning → available.
 *        Without these statuses the entire housekeeping phase is blocked.
 *
 * PROD-14: rooms.room_number has a global UNIQUE constraint.
 *          Room 101 at Resort A conflicts with Room 101 at Resort B.
 *          Must be unique per (resort_id, room_number).
 */
return new class extends Migration
{
    public function up(): void
    {
        // Step 1: Drop the global unique index on room_number
        // MySQL names auto-generated unique indexes as the column name.
        Schema::table('rooms', function (Blueprint $table) {
            $table->dropUnique(['room_number']);
        });

        // Step 2: Alter the status enum to add the three missing values.
        // MySQL requires re-declaring the full enum when altering. Other drivers
        // (sqlite in the test suite) store enums as varchar, so there is nothing
        // to widen there.
        if (DB::getDriverName() === 'mysql') {
            DB::statement("
                ALTER TABLE rooms
                MODIFY COLUMN status ENUM(
                    'available',
                    'reserved',
                    'occupied',
                    'dirty',
                    'cleaning',
                    'maintenance',
                    'out_of_service'
                ) NOT NULL DEFAULT 'available'
            ");
        }

        // Step 3: Add a composite unique index — room_number unique within a resort
        Schema::table('rooms', function (Blueprint $table) {
            $table->unique(['resort_id', 'room_number'], 'rooms_resort_id_room_number_unique');

            // Add soft delete for rooms (rooms can be deactivated, not destroyed)
            $table->softDeletes()->after('notes');
        });
    }

    public function down(): void
    {
        Schema::table('rooms', function (Blueprint $table) {
            $table->dropUnique('rooms_resort_id_room_number_unique');
            $table->dropSoftDeletes();
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement("
                ALTER TABLE rooms
                MODIFY COLUMN status ENUM(
                    'available',
                    'occupied',
                    'maintenance',
                    'reserved'
                ) NOT NULL DEFAULT 'available'
            ");
        }

        Schema::table('rooms', function (Blueprint $table) {
            $table->unique('room_number');
        });
    }
};
