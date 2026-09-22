<?php

namespace App\Services;

use App\Models\FoodOrder;
use App\Models\RestaurantTable;
use App\Models\TableReservation;
use App\Models\MenuItem;
use App\Models\RestaurantBill;
use Carbon\Carbon;

class RestaurantDashboardService
{
    public function getSummary(): array
    {
        $today = Carbon::today();

        return [
            'orders_today'       => FoodOrder::whereDate('created_at', $today)->count(),
            'pending_orders'     => FoodOrder::where('status', 'pending')->count(),
            'tables_available'   => RestaurantTable::where('status', 'available')->count(),
            'tables_occupied'    => RestaurantTable::where('status', 'occupied')->count(),
            'reservations_today' => TableReservation::whereDate('reserved_at', $today)->count(),
            'revenue_today'      => RestaurantBill::whereDate('created_at', $today)->sum('total_amount'),
            'top_menu_items'     => MenuItem::withCount('orderItems')->orderByDesc('order_items_count')->take(5)->get(),
        ];
    }
}
