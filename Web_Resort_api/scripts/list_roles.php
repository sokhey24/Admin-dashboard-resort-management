<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo json_encode(
    Illuminate\Support\Facades\DB::table('roles')->select('id', 'name', 'display_name')->get(),
    JSON_PRETTY_PRINT
) . PHP_EOL;
