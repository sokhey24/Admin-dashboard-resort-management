<?php

namespace App\Http\Controllers\Api\Booking;

use App\Http\Controllers\Controller;
use App\Http\Requests\Folio\PostFolioChargeRequest;
use App\Http\Requests\Folio\VoidFolioChargeRequest;
use App\Models\Booking;
use App\Models\FolioCharge;
use App\Models\Invoice;
use App\Services\FolioService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class GuestFolioController extends Controller
{
    public function __construct(protected FolioService $folios) {}

    public function show(Request $request, Booking $booking): JsonResponse
    {
        $user = $request->user();
        if ($user->isGuestAccount()) {
            $this->folios->assertGuestCanView($booking, $user);
        } else {
            $this->authorize('view', $booking);
        }

        $includeAudit = ! $user->isGuestAccount();

        return response()->json([
            'data' => $this->folios->summary($booking, $includeAudit),
        ]);
    }

    public function storeCharge(PostFolioChargeRequest $request, Booking $booking): JsonResponse
    {
        $this->authorize('update', $booking);

        $charge = $this->folios->postCharge($booking, $request->validated(), $request->user());

        return response()->json([
            'data' => $charge,
            'folio' => $this->folios->summary($booking->fresh(), true),
        ], 201);
    }

    public function voidCharge(VoidFolioChargeRequest $request, FolioCharge $folioCharge): JsonResponse
    {
        $folioCharge->loadMissing('folio.booking');
        $booking = $folioCharge->folio?->booking;
        if (! $booking) {
            return response()->json(['errors' => ['message' => 'Booking not found for this charge.']], 404);
        }

        $this->authorize('update', $booking);

        $charge = $this->folios->voidCharge(
            $folioCharge,
            $request->user(),
            (string) $request->validated('void_reason')
        );

        return response()->json([
            'data' => $charge,
            'folio' => $this->folios->summary($booking->fresh(), true),
        ]);
    }

    public function settle(Request $request, Booking $booking): JsonResponse
    {
        $this->authorize('update', $booking);

        $folio = $this->folios->settle($booking, $request->user());

        return response()->json([
            'data' => $folio,
            'folio' => $this->folios->summary($booking->fresh(), true),
        ]);
    }

    public function invoicePdf(Request $request, Booking $booking): StreamedResponse|JsonResponse
    {
        $user = $request->user();
        if ($user->isGuestAccount()) {
            $this->folios->assertGuestCanView($booking, $user);
        } else {
            $this->authorize('view', $booking);
        }

        if ($user->isGuestAccount()) {
            $invoice = $booking->invoice;
            if (! $invoice?->pdf_path) {
                return response()->json(['errors' => ['message' => 'Invoice PDF is not available yet.']], 404);
            }
        } else {
            $invoice = $this->folios->generateConsolidatedInvoice($booking, $user);
        }

        return $this->streamInvoicePdf($invoice);
    }

    protected function streamInvoicePdf(Invoice $invoice): StreamedResponse|JsonResponse
    {
        if (! $invoice->pdf_path) {
            return response()->json(['errors' => ['message' => 'Invoice PDF is not available yet.']], 404);
        }

        $disk = $invoice->pdf_disk ?: 'local';
        if (! Storage::disk($disk)->exists($invoice->pdf_path)) {
            return response()->json(['errors' => ['message' => 'Invoice PDF file is missing.']], 404);
        }

        return Storage::disk($disk)->download($invoice->pdf_path, basename($invoice->pdf_path));
    }
}
