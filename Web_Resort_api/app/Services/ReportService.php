<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Payment;
use App\Models\Room;
use Carbon\Carbon;

class ReportService
{
    public function bookingsReport(): array
    {
        return [
            'total'      => Booking::count(),
            'confirmed'  => Booking::where('status', 'confirmed')->count(),
            'cancelled'  => Booking::where('status', 'cancelled')->count(),
            'pending'    => Booking::where('status', 'pending')->count(),
            'this_month' => Booking::whereMonth('created_at', Carbon::now()->month)->count(),
        ];
    }

    public function revenueReport(): array
    {
        return [
            'total_revenue'       => Payment::where('status', 'paid')->sum('amount'),
            'revenue_this_month'  => Payment::where('status', 'paid')->whereMonth('created_at', Carbon::now()->month)->sum('amount'),
            'revenue_today'       => Payment::where('status', 'paid')->whereDate('created_at', Carbon::today())->sum('amount'),
        ];
    }

    public function roomsReport(): array
    {
        return [
            'total'       => Room::count(),
            'available'   => Room::where('status', 'available')->count(),
            'occupied'    => Room::where('status', 'occupied')->count(),
            'maintenance' => Room::where('status', 'maintenance')->count(),
        ];
    }
}
