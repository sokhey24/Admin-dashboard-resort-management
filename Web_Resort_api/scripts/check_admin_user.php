<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$email = 'admin123@gmail.com';
$user = App\Models\User::where('email', $email)->with('roles')->first();

if (!$user) {
    echo json_encode(['found' => false, 'email' => $email, 'database' => config('database.connections.mysql.database')], JSON_PRETTY_PRINT);
    exit(0);
}

$roles = $user->roles->pluck('name')->all();
$passwordOk = Illuminate\Support\Facades\Hash::check('12345678', $user->password);
$pivot = Illuminate\Support\Facades\DB::table('role_user')->where('user_id', $user->id)->get();

echo json_encode([
    'found' => true,
    'database' => config('database.default') . ':' . config('database.connections.mysql.database'),
    'id' => $user->id,
    'name' => $user->name,
    'email' => $user->email,
    'status' => $user->status,
    'email_verified' => (bool) $user->email_verified_at,
    'roles' => $roles,
    'role_user_pivot' => $pivot,
    'is_admin_role' => $user->isAdmin(),
    'password_matches_12345678' => $passwordOk,
    'permission_count_via_role' => count($user->permissions()),
    'has_admin_dashboard_view' => in_array('admin.dashboard.view', $user->permissions(), true),
], JSON_PRETTY_PRINT) . PHP_EOL;
