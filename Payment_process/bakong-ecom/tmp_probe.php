<?php

require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$request = Illuminate\Http\Request::create('/', 'GET');
$response = $kernel->handle($request);

echo 'STATUS='.$response->getStatusCode().PHP_EOL;
echo 'TYPE='.$response->headers->get('content-type').PHP_EOL;
echo 'LEN='.strlen($response->getContent()).PHP_EOL;
echo substr($response->getContent(), 0, 800).PHP_EOL;
