<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Folio line items live in folio_charges. guest_folios is the per-booking header.
 * If an older guest_folios line-item schema exists in production, legacy rows are migrated once.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('folio_charges')) {
            Schema::create('folio_charges', function (Blueprint $table) {
                $table->id();
                $table->foreignId('guest_folio_id')->constrained('guest_folios')->cascadeOnDelete();
                $table->string('charge_type', 32);
                $table->string('description');
                $table->decimal('quantity', 8, 2)->default(1);
                $table->decimal('unit_price', 10, 2)->default(0);
                $table->decimal('amount', 10, 2);
                $table->string('reference_type')->nullable();
                $table->unsignedBigInteger('reference_id')->nullable();
                $table->string('idempotency_key', 128)->nullable()->unique();
                $table->foreignId('posted_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('posted_at')->nullable();
                $table->text('note')->nullable();
                $table->timestamp('voided_at')->nullable();
                $table->foreignId('voided_by')->nullable()->constrained('users')->nullOnDelete();
                $table->text('void_reason')->nullable();
                $table->timestamps();

                $table->index(['reference_type', 'reference_id']);
                $table->index(['guest_folio_id', 'voided_at']);
            });
        }

        if (! Schema::hasTable('guest_folios')) {
            return;
        }

        if (! Schema::hasColumn('guest_folios', 'status')) {
            Schema::table('guest_folios', function (Blueprint $table) {
                $table->string('status', 20)->default('open')->after('resort_id');
                $table->string('currency', 10)->default('USD')->after('status');
                $table->timestamp('opened_at')->nullable()->after('currency');
                $table->timestamp('closed_at')->nullable()->after('opened_at');
            });
        }

        if (! Schema::hasColumn('guest_folios', 'charge_type')) {
            return;
        }

        $legacy = DB::table('guest_folios')->whereNotNull('charge_type')->orderBy('id')->get();
        foreach ($legacy as $row) {
            $headerId = DB::table('guest_folios')
                ->where('booking_id', $row->booking_id)
                ->whereNull('charge_type')
                ->value('id');

            if (! $headerId) {
                $headerId = DB::table('guest_folios')->insertGetId([
                    'folio_number' => 'FOL-BK-'.str_pad((string) $row->booking_id, 6, '0', STR_PAD_LEFT),
                    'booking_id' => $row->booking_id,
                    'guest_id' => $row->guest_id,
                    'resort_id' => $row->resort_id,
                    'status' => 'open',
                    'currency' => 'USD',
                    'opened_at' => $row->posted_at ?? $row->created_at ?? now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            if (Schema::hasTable('folio_charges')) {
                DB::table('folio_charges')->insert([
                    'guest_folio_id' => $headerId,
                    'charge_type' => $row->charge_type,
                    'description' => $row->description ?? 'Charge',
                    'quantity' => $row->quantity ?? 1,
                    'unit_price' => $row->unit_price ?? 0,
                    'amount' => $row->amount ?? 0,
                    'reference_type' => $row->reference_type,
                    'reference_id' => $row->reference_id,
                    'idempotency_key' => 'legacy_guest_folio_'.$row->id,
                    'posted_by' => $row->posted_by,
                    'posted_at' => $row->posted_at ?? $row->created_at,
                    'note' => $row->note,
                    'created_at' => $row->created_at ?? now(),
                    'updated_at' => $row->updated_at ?? now(),
                ]);
            }

            DB::table('guest_folios')->where('id', $row->id)->delete();
        }

        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            return;
        }

        $this->dropForeignKeyIfExists('guest_folios', 'posted_by');

        if (
            Schema::hasColumn('guest_folios', 'reference_type')
            && $this->indexExists('guest_folios', 'guest_folios_reference_type_reference_id_index')
        ) {
            Schema::table('guest_folios', function (Blueprint $table) {
                $table->dropIndex(['reference_type', 'reference_id']);
            });
        }

        Schema::table('guest_folios', function (Blueprint $table) {
            $drops = array_filter([
                Schema::hasColumn('guest_folios', 'charge_type') ? 'charge_type' : null,
                Schema::hasColumn('guest_folios', 'description') ? 'description' : null,
                Schema::hasColumn('guest_folios', 'quantity') ? 'quantity' : null,
                Schema::hasColumn('guest_folios', 'unit_price') ? 'unit_price' : null,
                Schema::hasColumn('guest_folios', 'amount') ? 'amount' : null,
                Schema::hasColumn('guest_folios', 'reference_type') ? 'reference_type' : null,
                Schema::hasColumn('guest_folios', 'reference_id') ? 'reference_id' : null,
                Schema::hasColumn('guest_folios', 'posted_by') ? 'posted_by' : null,
                Schema::hasColumn('guest_folios', 'posted_at') ? 'posted_at' : null,
                Schema::hasColumn('guest_folios', 'note') ? 'note' : null,
            ]);
            if ($drops !== []) {
                $table->dropColumn($drops);
            }
        });

        if (! $this->indexExists('guest_folios', 'guest_folios_booking_id_unique')) {
            Schema::table('guest_folios', function (Blueprint $table) {
                $table->unique('booking_id');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('folio_charges');
    }

    private function dropForeignKeyIfExists(string $table, string $column): void
    {
        if (Schema::getConnection()->getDriverName() !== 'mysql') {
            return;
        }

        $db = Schema::getConnection()->getDatabaseName();
        $row = DB::selectOne(
            'SELECT CONSTRAINT_NAME AS name FROM information_schema.KEY_COLUMN_USAGE
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL
             LIMIT 1',
            [$db, $table, $column]
        );

        if (! $row?->name) {
            return;
        }

        $name = str_replace('`', '``', $row->name);
        DB::statement("ALTER TABLE `{$table}` DROP FOREIGN KEY `{$name}`");
    }

    private function indexExists(string $table, string $indexName): bool
    {
        $connection = Schema::getConnection();
        $driver = $connection->getDriverName();

        if ($driver === 'sqlite') {
            $indexes = $connection->select("PRAGMA index_list({$table})");

            return collect($indexes)->contains(fn ($idx) => ($idx->name ?? '') === $indexName);
        }

        $db = $connection->getDatabaseName();
        $row = $connection->selectOne(
            'SELECT COUNT(*) AS c FROM information_schema.statistics WHERE table_schema = ? AND table_name = ? AND index_name = ?',
            [$db, $table, $indexName]
        );

        return (int) ($row->c ?? 0) > 0;
    }
};
