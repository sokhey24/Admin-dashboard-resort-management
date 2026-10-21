<?php

namespace App\Jobs;

use App\Models\Invoice;
use App\Models\Payment;
use App\Services\PaymentReceiptService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class GenerateInvoicePdfJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public readonly int $paymentId) {}

    public function handle(PaymentReceiptService $receipts): void
    {
        $payment = Payment::with(['booking.invoice'])->find($this->paymentId);
        if (! $payment || ! $payment->booking?->invoice) {
            return;
        }

        $invoice = $payment->booking->invoice;
        if ($invoice->pdf_path) {
            return;
        }

        $receipts->generatePrivateInvoicePdf($invoice, $payment);
    }
}
