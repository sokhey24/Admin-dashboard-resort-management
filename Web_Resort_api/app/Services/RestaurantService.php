<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\FoodOrder;
use App\Models\FoodOrderItem;
use App\Models\MenuItem;
use App\Models\Payment;
use App\Models\RestaurantBill;
use App\Models\RestaurantTable;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class RestaurantService
{
    public function __construct(
        protected PaymentService $payments,
        protected FolioService $folios,
        protected BookingService $bookings,
        protected KhqrQrImageService $khqrImages,
    ) {}

    public function createOrder(array $data): FoodOrder
    {
        $table = RestaurantTable::findOrFail($data['table_id']);

        $lines = $this->buildLinesFromInput($data['items'] ?? []);
        $totals = $this->calculateTotals($lines['subtotal']);
        $branchId = $table->branch_id;

        $order = DB::transaction(function () use ($data, $table, $lines, $totals, $branchId) {
            $order = $this->createOrderRecord([
                'restaurant_table_id' => $table->id,
                'branch_id' => $branchId,
                'user_id' => auth()->id(),
                'note' => $data['note'] ?? null,
                'fulfillment_type' => 'dine_in',
                'payment_method' => $data['payment_method'] ?? 'cash',
            ], $totals);

            $this->persistLines($order, $lines['lines']);

            return $order->fresh(['orderItems']);
        });

        return $order;
    }

    /**
     * @return array{order: FoodOrder, khqr?: array<string, mixed>}
     */
    public function createGuestOrder(User $user, array $data): array
    {
        if (! empty($data['client_request_id'])) {
            $existing = FoodOrder::query()
                ->where('client_request_id', $data['client_request_id'])
                ->where('user_id', $user->id)
                ->with('orderItems')
                ->first();
            if ($existing) {
                return $this->wrapGuestOrderResponse($existing, $user, $data['payment_method'] ?? null);
            }
        }

        $booking = null;
        if (($data['fulfillment_type'] ?? '') === 'room_delivery') {
            $booking = $this->resolveGuestChargeBooking($user, (int) $data['booking_id']);
        }

        if (($data['payment_method'] ?? '') === 'charge_to_room') {
            if (! $booking) {
                throw ValidationException::withMessages([
                    'payment_method' => ['Charge to room requires an active in-house booking.'],
                ]);
            }
        }

        $lines = $this->buildLinesFromInput($data['items'] ?? []);
        $totals = $this->calculateTotals($lines['subtotal']);
        $branchId = $lines['branch_id'] ?? $booking?->branch_id;

        $order = DB::transaction(function () use ($user, $data, $booking, $lines, $totals, $branchId) {
            $order = $this->createOrderRecord([
                'user_id' => $user->id,
                'booking_id' => $booking?->id,
                'branch_id' => $branchId,
                'restaurant_table_id' => null,
                'note' => $data['note'] ?? null,
                'fulfillment_type' => $data['fulfillment_type'],
                'payment_method' => $data['payment_method'],
                'client_request_id' => $data['client_request_id'] ?? null,
            ], $totals);

            $this->persistLines($order, $lines['lines']);

            if ($data['payment_method'] === 'charge_to_room' && $booking) {
                $this->createRoomChargeRecords($order, $booking);
                $this->folios->importFoodOrderCharge($order->fresh(), $booking);
            }

            return $order->fresh(['orderItems']);
        });

        return $this->wrapGuestOrderResponse($order, $user, $data['payment_method']);
    }

    public function updateOrder(FoodOrder $order, array $data): FoodOrder
    {
        $allowed = ['pending', 'preparing', 'served', 'cancelled', 'completed'];
        if (isset($data['status']) && ! in_array($data['status'], $allowed, true)) {
            throw ValidationException::withMessages(['status' => ['Invalid order status.']]);
        }

        $order->update(array_filter(
            array_intersect_key($data, array_flip(['status', 'note'])),
            fn ($v) => ! is_null($v)
        ));

        return $order->fresh()->load('orderItems');
    }

    /**
     * @param  array<int, array{menu_item_id: int, quantity: int}>  $items
     * @return array{subtotal: float, branch_id: ?int, lines: list<array>}
     */
    protected function buildLinesFromInput(array $items): array
    {
        if ($items === []) {
            throw ValidationException::withMessages(['items' => ['Add at least one menu item.']]);
        }

        $menuIds = array_values(array_unique(array_map(fn ($row) => (int) $row['menu_item_id'], $items)));
        $menuItems = MenuItem::query()
            ->with('category')
            ->whereIn('id', $menuIds)
            ->get()
            ->keyBy('id');

        if ($menuItems->count() !== count($menuIds)) {
            throw ValidationException::withMessages(['items' => ['One or more menu items are invalid.']]);
        }

        $lines = [];
        $subtotal = 0.0;
        $branchId = null;

        foreach ($items as $row) {
            $menuItem = $menuItems->get((int) $row['menu_item_id']);
            if (! $menuItem || ! $menuItem->is_available || $menuItem->status === 'inactive') {
                throw ValidationException::withMessages([
                    'items' => ["{$menuItem?->name} is not available for ordering."],
                ]);
            }

            $qty = (int) $row['quantity'];
            $unit = (float) $menuItem->price;
            $lineSubtotal = round($unit * $qty, 2);
            $subtotal += $lineSubtotal;

            $catBranch = $menuItem->category?->branch_id;
            if ($catBranch) {
                $catBranch = (int) $catBranch;
                if ($branchId === null) {
                    $branchId = $catBranch;
                } elseif ($catBranch !== $branchId) {
                    throw ValidationException::withMessages([
                        'items' => ['All items must belong to the same restaurant branch.'],
                    ]);
                }
            }

            $lines[] = [
                'menu_item_id' => $menuItem->id,
                'item_name' => $menuItem->name,
                'quantity' => $qty,
                'unit_price' => $unit,
                'subtotal' => $lineSubtotal,
            ];
        }

        return [
            'subtotal' => round($subtotal, 2),
            'branch_id' => $branchId,
            'lines' => $lines,
        ];
    }

    /**
     * @return array{subtotal: float, tax: float, service_charge: float, total: float}
     */
    protected function calculateTotals(float $subtotal): array
    {
        $taxRate = (float) config('pricing.tax_rate', 0.10);
        $serviceRate = (float) config('pricing.service_charge_rate', 0.10);
        $tax = round($subtotal * $taxRate, 2);
        $service = round($subtotal * $serviceRate, 2);

        return [
            'subtotal' => round($subtotal, 2),
            'tax' => $tax,
            'service_charge' => $service,
            'total' => round($subtotal + $tax + $service, 2),
        ];
    }

    protected function createOrderRecord(array $meta, array $totals): FoodOrder
    {
        $payload = [
            'user_id' => $meta['user_id'] ?? auth()->id(),
            'restaurant_table_id' => $meta['restaurant_table_id'] ?? null,
            'booking_id' => $meta['booking_id'] ?? null,
            'order_code' => 'ORD-'.strtoupper(Str::random(10)),
            'status' => 'pending',
            'note' => $meta['note'] ?? null,
            'subtotal' => $totals['subtotal'],
            'tax' => $totals['tax'],
            'service_charge' => $totals['service_charge'],
            'total' => $totals['total'],
            'fulfillment_type' => $meta['fulfillment_type'] ?? 'dine_in',
            'payment_method' => $meta['payment_method'] ?? null,
            'client_request_id' => $meta['client_request_id'] ?? null,
        ];

        if (Schema::hasColumn('food_orders', 'branch_id') && ! empty($meta['branch_id'])) {
            $payload['branch_id'] = $meta['branch_id'];
        }

        return FoodOrder::create($payload);
    }

    /**
     * @param  list<array>  $lines
     */
    protected function persistLines(FoodOrder $order, array $lines): void
    {
        foreach ($lines as $line) {
            FoodOrderItem::create([
                'food_order_id' => $order->id,
                'menu_item_id' => $line['menu_item_id'],
                'item_name' => $line['item_name'],
                'quantity' => $line['quantity'],
                'unit_price' => $line['unit_price'],
                'subtotal' => $line['subtotal'],
            ]);
        }
    }

    protected function resolveGuestChargeBooking(User $user, int $bookingId): Booking
    {
        $booking = Booking::with('rooms')->find($bookingId);
        if (! $booking) {
            throw ValidationException::withMessages(['booking_id' => ['Booking not found.']]);
        }

        $this->bookings->assertAccessible($booking, $user);

        if (! in_array($booking->status, ['confirmed', 'checked_in'], true)) {
            throw ValidationException::withMessages([
                'booking_id' => ['Room service is only available for confirmed or in-house stays.'],
            ]);
        }

        return $booking;
    }

    protected function createRoomChargeRecords(FoodOrder $order, Booking $booking): void
    {
        if (RestaurantBill::query()->where('food_order_id', $order->id)->exists()) {
            return;
        }

        RestaurantBill::create([
            'food_order_id' => $order->id,
            'bill_number' => 'BILL-'.strtoupper(Str::random(8)),
            'subtotal' => $order->subtotal,
            'tax' => $order->tax + (float) ($order->service_charge ?? 0),
            'discount' => 0,
            'total' => $order->total,
            'payment_method' => 'room_charge',
            'status' => 'unpaid',
        ]);

        Payment::create([
            'booking_id' => $booking->id,
            'user_id' => $order->user_id,
            'source' => 'restaurant',
            'reference_type' => FoodOrder::class,
            'reference_id' => $order->id,
            'amount' => $order->total,
            'method' => 'online',
            'payment_method' => 'room_charge',
            'currency' => 'USD',
            'subtotal' => $order->subtotal,
            'tax' => $order->tax,
            'service_charge' => $order->service_charge ?? 0,
            'paid_amount' => 0,
            'balance' => $order->total,
            'status' => 'pending',
            'created_by' => $order->user_id,
            'transaction_ref' => 'FO-'.strtoupper(uniqid()),
        ]);
    }

    /**
     * @return array{order: FoodOrder, khqr?: array<string, mixed>}
     */
    protected function wrapGuestOrderResponse(FoodOrder $order, User $user, ?string $paymentMethod): array
    {
        $payload = ['order' => $order->load('orderItems')];

        if ($paymentMethod === 'khqr') {
            $payment = $this->payments->initiateFoodOrderKhqr($order, $user);
            $qrPayload = (string) $payment->qr_payload;
            $payload['khqr'] = [
                'payment_id' => $payment->payment_id,
                'id' => $payment->id,
                'amount' => (float) $payment->amount,
                'currency' => $payment->currency,
                'status' => $payment->status,
                'khqr_md5' => $payment->khqr_md5,
                'qr_payload' => $qrPayload,
                'qr_svg' => $qrPayload !== '' ? $this->khqrImages->svg($qrPayload) : '',
                'expires_at' => $payment->expires_at?->toIso8601String(),
            ];
        }

        return $payload;
    }
}
