<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Resort;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\User;
use Illuminate\Support\Facades\DB;

// Remove leftovers from the earlier aborted end-to-end runs.
$rooms = Room::where('room_number', 'like', 'E2E-%')->pluck('id');
DB::table('booking_rooms')->whereIn('room_id', $rooms)->delete();
Room::whereIn('id', $rooms)->forceDelete();
RoomType::where('name', 'E2E-Deluxe')->delete();
$users = User::where('email', 'like', 'e2e-%@example.com')->pluck('id');
DB::table('personal_access_tokens')->whereIn('tokenable_id', $users)->delete();
DB::table('role_user')->whereIn('user_id', $users)->delete();
User::whereIn('id', $users)->delete();
DB::table('coupons')->where('code', 'like', 'E2E%')->delete();
Resort::where('name', 'E2E-Resort')->delete();

echo 'Orphans removed.'.PHP_EOL;
echo 'Remaining rooms: '.Room::count().PHP_EOL;
