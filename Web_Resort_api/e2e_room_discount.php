<?php

/**
 * Throwaway end-to-end check for the room percentage discount.
 *
 * Drives the real API over HTTP against the real database:
 * Dashboard write -> DB -> guest catalogue -> quote -> booking -> payment -> invoice.
 * Everything it creates is prefixed E2E- and removed at the end.
 *
 * Usage: php artisan serve --port=8123, then php e2e_room_discount.php
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Booking;
use App\Models\Coupon;
use App\Models\Payment;
use App\Models\Resort;
use App\Models\Role;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\User;
use Illuminate\Support\Facades\DB;

const BASE = 'http://127.0.0.1:8123/api';

$pass = 0;
$fail = 0;

function check(string $label, bool $ok, string $detail = ''): void
{
    global $pass, $fail;
    $ok ? $pass++ : $fail++;
    echo ($ok ? "  PASS  " : "  FAIL  ").$label.($detail ? "  [{$detail}]" : '').PHP_EOL;
}

function same(string $label, $expected, $actual): void
{
    check($label, abs((float) $expected - (float) $actual) < 0.005, "expected {$expected}, got ".var_export($actual, true));
}

function http(string $method, string $path, array $body = null, string $token = null): array
{
    $ch = curl_init(BASE.$path);
    $headers = ['Accept: application/json', 'Content-Type: application/json'];
    if ($token) {
        $headers[] = 'Authorization: Bearer '.$token;
    }
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_TIMEOUT => 30,
    ]);
    if ($body !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    }
    $raw = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);

    if ($err) {
        echo "  cURL error: {$err}".PHP_EOL;
    }

    return [$status, json_decode((string) $raw, true)];
}

// ── Fixtures ───────────────────────────────────────────────────────────────

echo PHP_EOL."Setting up fixtures on database: ".DB::getDatabaseName().PHP_EOL;

$resort = Resort::create([
    'name' => 'E2E-Resort', 'slug' => 'e2e-resort-'.uniqid(),
    'address' => 'E2E Road', 'city' => 'Sihanoukville',
]);

$type = RoomType::create([
    'resort_id' => $resort->id,
    'name' => 'E2E-Deluxe',
    'base_price' => 100,
    'discount_percent' => 0,
    'max_occupancy' => 4,
]);

$roomA = Room::create([
    'resort_id' => $resort->id, 'room_type_id' => $type->id,
    'room_number' => 'E2E-A'.random_int(100, 999),
    'price_per_night' => 100, 'discount_percent' => null, 'status' => 'available',
]);

$roomB = Room::create([
    'resort_id' => $resort->id, 'room_type_id' => $type->id,
    'room_number' => 'E2E-B'.random_int(100, 999),
    'price_per_night' => 200, 'discount_percent' => 10, 'status' => 'available',
]);

$adminRole = Role::firstOrCreate(['name' => 'admin'], ['display_name' => 'Admin']);
$admin = User::create(['name' => 'E2E-Admin', 'email' => 'e2e-admin-'.uniqid().'@example.com', 'password' => bcrypt('secret')]);
$admin->roles()->attach($adminRole->id);

$guest = User::create(['name' => 'E2E-Guest', 'email' => 'e2e-guest-'.uniqid().'@example.com', 'password' => bcrypt('secret')]);

$adminToken = $admin->createToken('e2e')->plainTextToken;
$guestToken = $guest->createToken('e2e')->plainTextToken;

$coupon = Coupon::create([
    'code' => 'E2E'.random_int(1000, 9999),
    'type' => 'percent', 'value' => 10,
    'status' => 'active', 'used_count' => 0,
]);

$createdBookingIds = [];

try {
    // ── 1. Dashboard writes the discount ────────────────────────────────────

    echo PHP_EOL.'1. Dashboard -> API -> Database'.PHP_EOL;

    [$s, $r] = http('PUT', "/admin/rooms/{$roomA->id}", ['discount_percent' => 15], $adminToken);
    check('admin sets room discount to 15%', $s === 200, "HTTP {$s}");
    same('API echoes effective_discount_percent', 15, $r['data']['effective_discount_percent'] ?? null);
    same('API echoes discounted_price_per_night', 85, $r['data']['discounted_price_per_night'] ?? null);
    same('column persisted in database', 15, $roomA->fresh()->discount_percent);

    [$s, $r] = http('PUT', "/admin/rooms/{$roomA->id}", ['discount_percent' => -5], $adminToken);
    check('negative discount rejected', $s === 422, "HTTP {$s}");

    [$s, $r] = http('PUT', "/admin/rooms/{$roomA->id}", ['discount_percent' => 120], $adminToken);
    check('discount over 100 rejected', $s === 422, "HTTP {$s}");

    [$s, $r] = http('PUT', "/admin/rooms/{$roomA->id}", ['discount_percent' => 'fifteen'], $adminToken);
    check('non-numeric discount rejected', $s === 422, "HTTP {$s}");

    [$s, $r] = http('PUT', "/admin/room-types/{$type->id}", ['discount_percent' => 25], $adminToken);
    check('admin sets room type discount to 25%', $s === 200, "HTTP {$s}");
    same('room type discounted_base_price', 75, $r['data']['discounted_base_price'] ?? null);

    // ── 2. Guest catalogue (website hydration source) ───────────────────────

    echo PHP_EOL.'2. Guest website catalogue'.PHP_EOL;

    [$s, $r] = http('GET', "/customer/rooms?per_page=50&resort_id={$resort->id}");
    check('public catalogue reachable', $s === 200, "HTTP {$s}");
    $rows = collect($r['data'] ?? [])->keyBy('id');
    $a = $rows[$roomA->id] ?? null;
    check('room carries room_type for the mapper', isset($a['room_type']['name']));
    same('room A shows 15% override', 15, $a['effective_discount_percent'] ?? null);
    same('room A shows $85 net', 85, $a['discounted_price_per_night'] ?? null);
    same('room B inherits nothing (own 10%)', 10, $rows[$roomB->id]['effective_discount_percent'] ?? null);

    // Inheritance: clear the room override, expect the 25% room type campaign.
    http('PUT', "/admin/rooms/{$roomA->id}", ['discount_percent' => null], $adminToken);
    [$s, $r] = http('GET', "/customer/rooms?per_page=50&resort_id={$resort->id}");
    $a = collect($r['data'])->firstWhere('id', $roomA->id);
    same('null override inherits room type 25%', 25, $a['effective_discount_percent'] ?? null);
    http('PUT', "/admin/rooms/{$roomA->id}", ['discount_percent' => 15], $adminToken);

    // ── 3. Quote ────────────────────────────────────────────────────────────

    echo PHP_EOL.'3. Quote endpoint'.PHP_EOL;

    $stay = ['check_in' => '2027-11-01', 'check_out' => '2027-11-04', 'adults' => 2];

    [$s, $r] = http('POST', '/customer/booking/quote', array_merge($stay, ['room_ids' => [$roomA->id]]));
    $q = $r['data'] ?? [];
    check('quote is public (no token)', $s === 200, "HTTP {$s}");
    same('nights', 3, $q['nights'] ?? null);
    same('original subtotal 100 x 3', 300, $q['subtotal'] ?? null);
    same('discount amount 15%', 45, $q['room_discount_total'] ?? null);
    same('discounted subtotal', 255, $q['discounted_subtotal'] ?? null);
    same('tax on discounted subtotal', 25.5, $q['tax'] ?? null);
    same('service charge on discounted subtotal', 25.5, $q['service_charge'] ?? null);
    same('final total', 306, $q['total'] ?? null);

    [$s, $r] = http('POST', '/customer/booking/quote', array_merge($stay, ['room_ids' => [$roomA->id, $roomB->id]]));
    $q2 = $r['data'] ?? [];
    same('two rooms gross (300 + 600)', 900, $q2['subtotal'] ?? null);
    same('two rooms discount (45 + 60)', 105, $q2['room_discount_total'] ?? null);
    same('two rooms total', 954, $q2['total'] ?? null);

    [$s, $r] = http('POST', '/customer/booking/quote', array_merge($stay, ['room_ids' => [$roomA->id], 'coupon_code' => $coupon->code]));
    $q3 = $r['data'] ?? [];
    same('coupon applies to 255 not 300', 25.5, $q3['coupon_discount'] ?? null);
    same('total with coupon', 275.4, $q3['total'] ?? null);

    [$s, $r] = http('POST', '/customer/booking/quote', ['room_ids' => [$roomA->id], 'check_in' => '2027-11-04', 'check_out' => '2027-11-01', 'adults' => 2]);
    check('reversed dates rejected', $s === 422, "HTTP {$s}");

    [$s, $r] = http('POST', '/customer/booking/quote', array_merge($stay, ['room_ids' => [$roomA->id], 'adults' => 9]));
    check('over-occupancy rejected', $s === 422, "HTTP {$s}");

    // ── 4. Booking + snapshot ───────────────────────────────────────────────

    echo PHP_EOL.'4. Booking and price snapshot'.PHP_EOL;

    // Tampered money fields sent alongside the real request.
    [$s, $r] = http('POST', '/customer/bookings', array_merge($stay, [
        'resort_id' => $resort->id,
        'room_ids' => [$roomA->id],
        'subtotal' => 1,
        'discount' => 999,
        'tax_amount' => 0,
        'service_charge_amount' => 0,
        'total_amount' => 1,
    ]), $guestToken);

    check('booking created', $s === 201, "HTTP {$s} ".json_encode($r['message'] ?? ''));
    $booking = $r['data'] ?? [];
    $bookingId = $booking['id'] ?? null;
    if ($bookingId) {
        $createdBookingIds[] = $bookingId;
    }
    same('tampered subtotal ignored', 300, $booking['subtotal'] ?? null);
    same('tampered discount ignored', 45, $booking['discount'] ?? null);
    same('room_discount_total stored', 45, $booking['room_discount_total'] ?? null);
    same('tampered total ignored', 306, $booking['total_amount'] ?? null);

    $pivot = DB::table('booking_rooms')->where('booking_id', $bookingId)->first();
    same('pivot price_per_night snapshot', 100, $pivot->price_per_night ?? null);
    same('pivot discount_percent snapshot', 15, $pivot->discount_percent ?? null);
    same('pivot discount_amount snapshot', 45, $pivot->discount_amount ?? null);
    same('pivot net_subtotal snapshot', 255, $pivot->net_subtotal ?? null);

    // Admin raises the discount afterwards; the existing booking must not move.
    http('PUT', "/admin/rooms/{$roomA->id}", ['discount_percent' => 50], $adminToken);

    [$s, $r] = http('GET', "/customer/bookings/{$bookingId}", null, $guestToken);
    $after = $r['data'] ?? $r;
    same('existing booking total unchanged', 306, $after['total_amount'] ?? null);
    same('existing booking discount unchanged', 45, $after['discount'] ?? null);

    [$s, $r] = http('POST', '/customer/booking/quote', ['room_ids' => [$roomA->id], 'check_in' => '2027-12-01', 'check_out' => '2027-12-04', 'adults' => 2]);
    same('new quote picks up the new 50%', 150, $r['data']['room_discount_total'] ?? null);

    http('PUT', "/admin/rooms/{$roomA->id}", ['discount_percent' => 15], $adminToken);

    // Pivot must not be writable directly.
    $pivotRow = DB::table('booking_rooms')->where('booking_id', $bookingId)->first();
    [$s, $r] = http('PUT', "/admin/booking-rooms/{$pivotRow->id}", ['price_per_night' => 1, 'discount_percent' => 99], $adminToken);
    check('direct pivot edit refused', $s === 422, "HTTP {$s}");
    same('pivot rate still intact', 100, DB::table('booking_rooms')->where('id', $pivotRow->id)->value('price_per_night'));

    // ── 5. Payment ──────────────────────────────────────────────────────────

    echo PHP_EOL.'5. Payment'.PHP_EOL;

    [$s, $r] = http('POST', '/admin/payments', [
        'booking_id' => $bookingId,
        'payment_method' => 'qr_code',
        'amount' => 1,
        'status' => 'paid',
    ], $adminToken);
    check('payment accepted', $s === 201, "HTTP {$s} ".json_encode($r['message'] ?? ''));
    $receipt = $r['data'] ?? [];

    [$s, $r] = http('POST', '/admin/payments', [
        'booking_id' => $bookingId,
        'payment_method' => 'qr_code',
        'amount' => 10000,
        'status' => 'paid',
    ], $adminToken);
    check('overpayment beyond authoritative total refused', $s >= 400, "HTTP {$s}");

    // ── 6. Invoice / receipt breakdown ──────────────────────────────────────

    echo PHP_EOL.'6. Invoice breakdown'.PHP_EOL;

    $paymentId = $receipt['id'] ?? null;
    [$s, $r] = http('GET', "/admin/payments/{$paymentId}/receipt", null, $adminToken);
    $data = $r['data'] ?? [];
    check('receipt reachable', $s === 200, "HTTP {$s}");

    $fin = $data['booking'] ?? $data['reference'] ?? [];
    $line = ($data['reference']['rooms'] ?? [])[0] ?? [];

    same('receipt original price per night', 100, $line['price_per_night'] ?? null);
    same('receipt nights', 3, $line['nights'] ?? null);
    same('receipt original subtotal', 300, $line['subtotal'] ?? null);
    same('receipt discount percent', 15, $line['discount_percent'] ?? null);
    same('receipt discount amount', 45, $line['discount_amount'] ?? null);
    same('receipt net subtotal', 255, $line['net_subtotal'] ?? null);

    $inv = Booking::find($bookingId)->invoice;
    check('invoice row written', $inv !== null);
    if ($inv) {
        same('invoice original amount', 300, $inv->amount);
        same('invoice discount', 45, $inv->discount);
        same('invoice tax', 25.5, $inv->tax);
        same('invoice service charge', 25.5, $inv->service_charge);
        same('invoice total matches booking total', 306, $inv->total);
    }
} finally {
    // ── Cleanup ─────────────────────────────────────────────────────────────

    echo PHP_EOL.'Cleaning up…'.PHP_EOL;

    foreach ($createdBookingIds as $id) {
        DB::table('activity_logs')->where('model_type', Payment::class)
            ->whereIn('model_id', Payment::where('reference_id', $id)->pluck('id'))->delete();
        DB::table('invoices')->where('booking_id', $id)->delete();
        DB::table('payments')->where('reference_id', $id)->where('reference_type', Booking::class)->delete();
        DB::table('booking_status_logs')->where('booking_id', $id)->delete();
        DB::table('booking_rooms')->where('booking_id', $id)->delete();
        DB::table('bookings')->where('id', $id)->delete();
    }

    DB::table('personal_access_tokens')->whereIn('tokenable_id', [$admin->id, $guest->id])->delete();
    Coupon::where('id', $coupon->id)->delete();
    Room::whereIn('id', [$roomA->id, $roomB->id])->delete();
    RoomType::where('id', $type->id)->delete();
    DB::table('role_user')->whereIn('user_id', [$admin->id, $guest->id])->delete();
    User::whereIn('id', [$admin->id, $guest->id])->delete();
    Resort::where('id', $resort->id)->delete();

    echo PHP_EOL."Passed: {$pass}   Failed: {$fail}".PHP_EOL.PHP_EOL;
    exit($fail === 0 ? 0 : 1);
}
