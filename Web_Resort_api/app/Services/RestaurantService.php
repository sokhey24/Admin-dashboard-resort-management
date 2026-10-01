<?php

namespace App\Services;

use App\Models\FoodOrder;
use App\Models\FoodOrderItem;
use App\Models\MenuItem;
use App\Models\RestaurantTable;
use Illuminate\Support\Facades\Schema;

class RestaurantService
{
    public function createOrder(array $data): FoodOrder
    {
        $table = RestaurantTable::findOrFail($data['table_id']);

        $payload = [
            'restaurant_table_id' => $data['table_id'],
            'user_id'             => auth()->id(),
            'order_code'          => 'ORD-' . strtoupper(uniqid()),
            'status'              => 'pending',
            'note'                => $data['note'] ?? null,
            'subtotal'            => 0,
            'tax'                 => 0,
            'total'               => 0,
        ];

        if (Schema::hasColumn('food_orders', 'branch_id') && $table->branch_id) {
            $payload['branch_id'] = $table->branch_id;
        }

        $order = FoodOrder::create($payload);

        $subtotal = 0;
        foreach ($data['items'] as $item) {
            $menuItem = MenuItem::findOrFail($item['menu_item_id']);
            $lineTotal = $menuItem->price * $item['quantity'];
            $subtotal += $lineTotal;

            FoodOrderItem::create([
                'food_order_id' => $order->id,
                'menu_item_id'  => $item['menu_item_id'],
                'quantity'      => $item['quantity'],
                'unit_price'    => $menuItem->price,
                'subtotal'      => $lineTotal,
            ]);
        }

        $tax   = round($subtotal * 0.1, 2);
        $total = $subtotal + $tax;

        $order->update(['subtotal' => $subtotal, 'tax' => $tax, 'total' => $total]);

        return $order->load('orderItems');
    }

    public function updateOrder(FoodOrder $order, array $data): FoodOrder
    {
        $order->update(array_filter(
            array_intersect_key($data, array_flip(['status', 'note'])),
            fn($v) => !is_null($v)
        ));

        return $order->fresh()->load('orderItems');
    }
}
