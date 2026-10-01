<?php

namespace App\Http\Controllers\Api\Payment;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Services\PaymentReceiptService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    public function __construct(protected PaymentReceiptService $receiptService) {}

    public function index(Request $request): JsonResponse
    {
        $q = Invoice::with([
            'booking.user',
            'booking.resort',
            'booking.coupon',
            'booking.rooms.roomType',
            'booking.rooms.branch',
        ]);
        $user = $request->user();
        if ($user && ! $user->canViewAllResortData()) {
            $assigned = $user->assignedResortIds();
            if ($assigned === []) {
                $q->whereRaw('1 = 0');
            } else {
                $q->whereHas('booking', fn ($b) => $b->whereIn('resort_id', $assigned));
            }
        }

        if ($branchId = $request->query('branch_id')) {
            $q->whereHas('booking.rooms', fn ($r) => $r->where('branch_id', (int) $branchId));
        }

        return response()->json(['data' => $q->latest()->get()]);
    }

    public function show(Request $request, Invoice $invoice): JsonResponse
    {
        $invoice->load([
            'booking.user',
            'booking.resort',
            'booking.coupon',
            'booking.rooms.roomType',
            'booking.rooms.branch',
            'booking.payments',
        ]);
        $user = $request->user();
        $booking = $invoice->booking;
        if ($booking && $user && ! $user->canViewAllResortData()) {
            app(\App\Services\ResortAccessService::class)->assertResortAccessible($user, (int) $booking->resort_id);
        }

        return response()->json([
            'data' => $invoice,
            'document' => $this->receiptService->buildInvoiceData($invoice),
        ]);
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
