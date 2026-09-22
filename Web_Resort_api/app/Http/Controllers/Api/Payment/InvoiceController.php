<?php

namespace App\Http\Controllers\Api\Payment;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = Invoice::with(['booking.user', 'booking.rooms', 'booking.resort']);
        $user = $request->user();
        if ($user && ! $user->isAdmin()) {
            $assigned = $user->assignedResortIds();
            if ($assigned !== []) {
                $q->whereHas('booking', fn ($b) => $b->whereIn('resort_id', $assigned));
            }
        }

        return response()->json(['data' => $q->latest()->get()]);
    }

    public function show(Request $request, Invoice $invoice): JsonResponse
    {
        $invoice->load(['booking.user', 'booking.rooms.roomType', 'booking.resort', 'booking.payments']);
        $user = $request->user();
        $booking = $invoice->booking;
        if ($booking && $user && ! $user->isAdmin()) {
            $assigned = $user->assignedResortIds();
            if ($assigned !== [] && ! in_array((int) $booking->resort_id, $assigned, true)) {
                abort(403, 'You cannot access invoices for this resort.');
            }
        }

        return response()->json(['data' => $invoice]);
    }

    public function store(): JsonResponse
    {
        return response()->json(['errors' => ['message' => 'Invoices are generated automatically when a booking payment is recorded.']], 422);
    }

    public function update(): JsonResponse
    {
        return response()->json(['errors' => ['message' => 'Invoices are updated automatically with payments.']], 422);
    }

    public function destroy(): JsonResponse
    {
        return response()->json(['errors' => ['message' => 'Invoices cannot be deleted.']], 422);
    }
}
