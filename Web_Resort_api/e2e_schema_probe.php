<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

echo 'Database: '.DB::getDatabaseName().PHP_EOL.PHP_EOL;

foreach (['activity_logs', 'rooms', 'room_types', 'booking_rooms', 'bookings', 'invoices', 'coupons'] as $table) {
    echo str_pad($table, 16).': '.implode(', ', Schema::getColumnListing($table)).PHP_EOL.PHP_EOL;
}

echo 'Last 5 migrations run:'.PHP_EOL;
foreach (DB::table('migrations')->orderByDesc('id')->limit(5)->pluck('migration') as $m) {
    echo '  '.$m.PHP_EOL;
}
