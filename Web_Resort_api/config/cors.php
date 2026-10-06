<?php

/*
 * The dashboard (Vite) and the guest website are separate origins, so both must
 * be listed here for the browser to reach the API. Override per environment with
 * a comma-separated CORS_ALLOWED_ORIGINS.
 */
$origins = array_values(array_filter(array_map(
    'trim',
    explode(',', (string) env('CORS_ALLOWED_ORIGINS', ''))
)));

return [
    'paths'                    => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods'          => ['*'],
    'allowed_origins'          => $origins ?: [
        // XAMPP / Apache (Resort Website under http://localhost/...)
        'http://localhost',
        'http://127.0.0.1',
        // file:// pages send Origin: null (local HTML only — prefer http:// above)
        'null',
        // Dashboard (Vite dev server)
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:3000',
        'http://localhost:3001',
        // Guest website (static host / Live Server)
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        'http://localhost:8080',
        'http://127.0.0.1:8080',
    ],
    'allowed_origins_patterns' => [
        '#^https://[\w-]+\.vercel\.app$#',
        // LAN / local network (other PCs, phones on same Wi‑Fi)
        '#^http://192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$#',
        '#^http://10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$#',
        '#^http://172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}(:\d+)?$#',
    ],
    'allowed_headers'          => ['*'],
    'exposed_headers'          => [],
    'max_age'                  => 0,
    'supports_credentials'     => false,
];
