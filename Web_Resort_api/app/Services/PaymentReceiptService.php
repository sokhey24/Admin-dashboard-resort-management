<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\Booking;
use App\Models\Invoice;
use App\Models\Payment;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

class PaymentReceiptService
{
    /**
     * Build structured receipt data from Payment model.
     * This is the single source of truth — amounts come from DB only.
     */
    public function buildReceiptData(Payment $payment, ?string $generatedBy = null): array
    {
        $payment->loadMissing(['guest', 'reference', 'transactions']);

        $ref    = $payment->reference;
        $source = $payment->source;

        // Fallback: if polymorphic not set, try legacy booking relation
        if (!$ref && $payment->booking_id) {
            $payment->loadMissing('booking');
            $ref    = $payment->booking;
            $source = 'resort';
        }

        $referenceData = null;

        if ($source === 'resort' && $ref) {
            $ref->loadMissing(['rooms.roomType', 'rooms.branch', 'resort', 'user']);
            $firstRoom = $ref->rooms?->first();
            $nights = $this->resolveBookingNights($ref);
            $referenceData = [
                'booking_id'   => $ref->id,
                'booking_code' => $ref->booking_code,
                'resort'       => [
                    'id'       => $ref->resort_id,
                    'name'     => $ref->resort?->name,
                    'phone'    => $ref->resort?->phone,
                    'email'    => $ref->resort?->email,
                    'logo_url' => $ref->resort?->logo ? Storage::disk('public')->url($ref->resort->logo) : null,
                ],
                'branch'       => ['name' => $firstRoom?->branch?->name],
                'rooms'        => $this->mapBookingRoomsForDocument($ref),
                'check_in'     => $ref->check_in?->toIso8601String(),
                'check_out'    => $ref->check_out?->toIso8601String(),
                'nights'       => $nights,
                'adults'       => (int) ($ref->adults ?? 0),
                'children'     => (int) ($ref->children ?? 0),
                'status'       => $ref->status,
                'balance_due'  => (float) ($ref->balance_due ?? 0),
                'total_amount' => (float) ($ref->total_amount ?? 0),
            ];
        } elseif ($source === 'restaurant' && $ref) {
            $ref->loadMissing(['restaurantTable.resort']);
            $table  = $ref->restaurantTable;
            $resort = $table?->resort;
            $referenceData = [
                'order_code' => $ref->order_code,
                'restaurant' => ['name' => $resort?->name, 'logo' => $resort?->logo ?? null, 'phone' => $resort?->phone ?? null, 'email' => $resort?->email ?? null],
                'branch'     => ['name' => null],
                'table'      => ['table_number' => $table?->table_number, 'location' => $table?->location],
                'created_at' => $ref->created_at?->toIso8601String(),
                'status'     => $ref->status,
            ];
        }

        // Guest: prefer explicit user_id, fallback to booking user
        $guest = $payment->guest ?? $ref?->user ?? null;

        $bookingFinancials = null;
        $invoiceData = null;
        if ($source === 'resort' && $ref) {
            $ref->loadMissing(['invoice', 'coupon']);
            $subtotal = (float) $ref->subtotal;
            $discount = (float) $ref->discount;
            $roomDiscount = (float) ($ref->room_discount_total ?? 0);
            $couponDiscount = max(0, round($discount - $roomDiscount, 2));
            $tax = (float) ($ref->tax_amount ?? 0);
            $service = (float) ($ref->service_charge_amount ?? 0);
            $total = (float) $ref->total_amount;
            if ($total <= 0) {
                $total = max(0, $subtotal - $discount + $tax + $service);
            }
            $paid = (float) ($ref->deposit_amount ?? $payment->paid_amount);
            $roomDiscountPercent = $subtotal > 0 ? round(($roomDiscount / $subtotal) * 100, 2) : 0.0;
            $bookingFinancials = [
                'subtotal' => $subtotal,
                'room_discount_total' => $roomDiscount,
                'room_discount_percent' => $roomDiscountPercent,
                'coupon_discount' => $couponDiscount,
                'coupon_code' => $ref->coupon?->code,
                'discount' => $discount,
                'discounted_subtotal' => round($subtotal - $discount, 2),
                'tax' => $tax,
                'service_charge' => $service,
                'total' => $total,
                'paid' => $paid,
                'balance' => (float) ($ref->balance_due ?? max(0, $total - $paid)),
            ];
            if ($ref->invoice) {
                $invoiceData = [
                    'id' => $ref->invoice->id,
                    'invoice_number' => $ref->invoice->invoice_number,
                    'status' => $ref->invoice->status,
                    'subtotal' => (float) ($ref->invoice->amount ?? $subtotal),
                    'discount' => (float) ($ref->invoice->discount ?? $discount),
                    'tax' => (float) ($ref->invoice->tax ?? $tax),
                    'service_charge' => (float) ($ref->invoice->service_charge ?? $service),
                    'total' => (float) ($ref->invoice->total ?? $total),
                ];
            }
        }

        return [
            'id'                => $payment->id,
            'payment_id'        => $payment->payment_id ?? "PAY-{$payment->id}",
            'source'            => $source ?? 'resort',
            'status'            => $payment->status,
            'amount'            => (float) $payment->amount,
            'currency'          => $payment->currency ?? 'USD',
            'payment_method'    => $payment->payment_method ?? $payment->method,
            'transaction_id'    => $payment->transactions?->last()?->gateway_ref ?? $payment->transaction_ref,
            'gateway'           => $payment->gateway,
            'payment_reference' => $payment->payment_reference,
            'card_last4'        => $payment->card_last4, // already masked in model accessor
            'card_brand'        => $payment->card_brand,
            'stripe_payment_intent_id' => $payment->stripe_payment_intent_id,
            'paid_at'           => $payment->paid_at?->toIso8601String(),
            'refunded_at'       => $payment->refunded_at?->toIso8601String(),
            'notes'             => $payment->note,
            'breakdown'         => $bookingFinancials ?? $payment->breakdown,
            'invoice'           => $invoiceData,
            'guest'             => $guest ? [
                'id'    => $guest->id,
                'name'  => $guest->name,
                'email' => $guest->email,
                'phone' => $guest->phone ?? null,
            ] : null,
            'reference'         => $referenceData,
            'generated_by'      => $generatedBy,
        ];
    }

    /**
     * Structured invoice document (rooms, stay, guest, financials from DB).
     */
    public function buildInvoiceData(Invoice $invoice): array
    {
        $invoice->loadMissing([
            'booking.user',
            'booking.resort',
            'booking.coupon',
            'booking.rooms.roomType',
            'booking.rooms.branch',
            'booking.payments',
        ]);

        $booking = $invoice->booking;
        if (!$booking) {
            return [
                'invoice' => [
                    'id' => $invoice->id,
                    'invoice_number' => $invoice->invoice_number,
                    'status' => $invoice->status,
                    'issued_at' => $invoice->issued_at?->toIso8601String(),
                ],
                'rooms' => [],
            ];
        }

        $subtotal = (float) ($invoice->amount ?? $booking->subtotal ?? 0);
        $discount = (float) ($invoice->discount ?? $booking->discount ?? 0);
        $roomDiscount = (float) ($booking->room_discount_total ?? 0);
        $couponDiscount = max(0, round($discount - $roomDiscount, 2));
        $tax = (float) ($invoice->tax ?? $booking->tax_amount ?? 0);
        $service = (float) ($invoice->service_charge ?? $booking->service_charge_amount ?? 0);
        $total = (float) ($invoice->total ?? $booking->total_amount ?? 0);
        if ($total <= 0) {
            $total = max(0, $subtotal - $discount + $tax + $service);
        }
        $paid = (float) ($booking->deposit_amount ?? 0);
        $roomDiscountPercent = $subtotal > 0 ? round(($roomDiscount / $subtotal) * 100, 2) : 0.0;

        $guest = $booking->user;
        $nights = $this->resolveBookingNights($booking);

        $payments = $booking->payments?->map(fn (Payment $p) => [
            'id' => $p->id,
            'payment_id' => $p->payment_id ?? "PAY-{$p->id}",
            'status' => $p->status,
            'payment_method' => $p->payment_method ?? $p->method,
            'amount' => (float) $p->amount,
            'paid_at' => $p->paid_at?->toIso8601String(),
        ])->values()->toArray() ?? [];

        return [
            'invoice' => [
                'id' => $invoice->id,
                'invoice_number' => $invoice->invoice_number,
                'status' => $invoice->status,
                'issued_at' => $invoice->issued_at?->toIso8601String(),
                'due_at' => $invoice->due_at?->toIso8601String(),
            ],
            'booking' => [
                'id' => $booking->id,
                'booking_code' => $booking->booking_code,
                'status' => $booking->status,
                'resort' => [
                    'id' => $booking->resort_id,
                    'name' => $booking->resort?->name,
                    'phone' => $booking->resort?->phone,
                    'email' => $booking->resort?->email,
                    'address' => $booking->resort?->address,
                ],
            ],
            'guest' => $guest ? [
                'id' => $guest->id,
                'name' => $guest->name,
                'email' => $guest->email,
                'phone' => $guest->phone ?? null,
            ] : null,
            'stay' => [
                'check_in' => $booking->check_in?->toIso8601String(),
                'check_out' => $booking->check_out?->toIso8601String(),
                'nights' => $nights,
                'adults' => (int) ($booking->adults ?? 0),
                'children' => (int) ($booking->children ?? 0),
            ],
            'rooms' => $this->mapBookingRoomsForDocument($booking),
            'breakdown' => [
                'subtotal' => $subtotal,
                'room_discount_total' => $roomDiscount,
                'room_discount_percent' => $roomDiscountPercent,
                'coupon_discount' => $couponDiscount,
                'coupon_code' => $booking->coupon?->code,
                'discount' => $discount,
                'discounted_subtotal' => round($subtotal - $discount, 2),
                'tax' => $tax,
                'service_charge' => $service,
                'total' => $total,
                'paid' => $paid,
                'balance' => (float) ($booking->balance_due ?? max(0, $total - $paid)),
            ],
            'payments' => $payments,
        ];
    }

    /**
     * Generate PDF receipt and store to storage/app/public/receipts/.
     * Returns ['url' => ..., 'filename' => ...].
     */
    /**
     * Invoice-style document (matches dashboard ResortInvoiceReceipt).
     */
    public function buildPaymentInvoiceDocument(Payment $payment, ?string $generatedBy = null): array
    {
        $data = $this->buildReceiptData($payment, $generatedBy);
        $ref = $data['reference'] ?? [];
        $bd = $data['breakdown'] ?? [];
        $inv = $data['invoice'] ?? [];
        $isResort = ($data['source'] ?? 'resort') === 'resort';

        $total = (float) ($bd['total'] ?? $data['amount'] ?? 0);
        $paid = (float) ($bd['paid'] ?? $data['amount'] ?? 0);
        $balance = (float) ($bd['balance'] ?? 0);

        $resort = $isResort
            ? ($ref['resort'] ?? null)
            : ($ref['restaurant'] ?? null);

        $logoPath = null;
        if ($isResort && !empty($ref['resort']['logo_url'])) {
            $resortModel = $payment->reference;
            if ($resortModel && $resortModel->resort?->logo) {
                $candidate = Storage::disk('public')->path($resortModel->resort->logo);
                if (is_file($candidate)) {
                    $logoPath = $candidate;
                }
            }
        }

        return [
            'logo_path' => $logoPath,
            'logo_url' => is_array($resort) ? ($resort['logo_url'] ?? null) : null,
            'invoice' => [
                'invoice_number' => $inv['invoice_number'] ?? $data['payment_id'],
                'status' => $inv['status'] ?? ($data['status'] === 'paid' ? 'paid' : ($data['status'] ?? 'pending')),
                'issued_at' => $data['paid_at'] ?? now()->toIso8601String(),
            ],
            'booking' => [
                'booking_code' => $ref['booking_code'] ?? ($ref['order_code'] ?? null),
                'status' => $ref['status'] ?? null,
                'resort' => $resort,
            ],
            'guest' => $data['guest'],
            'stay' => $isResort ? [
                'check_in' => $ref['check_in'] ?? null,
                'check_out' => $ref['check_out'] ?? null,
                'nights' => $ref['nights'] ?? null,
                'adults' => $ref['adults'] ?? 0,
                'children' => $ref['children'] ?? 0,
            ] : [],
            'breakdown' => array_merge([
                'subtotal' => $total,
                'tax' => 0,
                'service_charge' => 0,
                'total' => $total,
                'paid' => $paid,
                'balance' => $balance,
            ], $bd),
            'payments' => [[
                'payment_method' => $data['payment_method'] ?? null,
                'amount' => $data['amount'] ?? 0,
            ]],
            'payment_id' => $data['payment_id'],
        ];
    }

    public function generatePdf(Payment $payment, ?string $generatedBy = null): array
    {
        $data     = $this->buildReceiptData($payment, $generatedBy);
        $doc      = $this->buildPaymentInvoiceDocument($payment, $generatedBy);
        $isRefund = $payment->status === 'refunded';
        $isResort = ($data['source'] ?? 'resort') === 'resort';

        $filename = match (true) {
            $isRefund => "{$data['payment_id']}_Refund_Receipt.pdf",
            !$isResort => "{$data['payment_id']}_Restaurant_Payment_Receipt.pdf",
            default   => "{$data['payment_id']}_Payment_Receipt.pdf",
        };

        $pdf  = Pdf::loadView('receipts.payment', compact('data', 'doc'))
            ->setPaper([0, 0, 340, 720], 'portrait');
        $path = "public/receipts/{$filename}";
        Storage::put($path, $pdf->output());

        return [
            'filename' => $filename,
            'url'      => Storage::url("receipts/{$filename}"),
        ];
    }

    /**
     * Store an invoice PDF on the private local disk (not web-public).
     */
    public function generatePrivateInvoicePdf(Invoice $invoice, ?Payment $payment = null, ?string $generatedBy = null): Invoice
    {
        if ($invoice->pdf_path) {
            return $invoice;
        }

        $invoice->loadMissing('booking.payments');
        $booking = $invoice->booking;
        if (! $booking) {
            return $invoice;
        }

        $payment = $payment
            ?? ($invoice->payment_id ? Payment::find($invoice->payment_id) : null)
            ?? $booking->payments()->where('status', 'paid')->latest()->first();

        if (! $payment) {
            return $invoice;
        }

        $data = $this->buildReceiptData($payment, $generatedBy);
        $doc = $this->buildPaymentInvoiceDocument($payment, $generatedBy);
        $filename = preg_replace('/[^A-Za-z0-9._-]+/', '_', $invoice->invoice_number).'.pdf';
        $path = "invoices/{$invoice->id}/{$filename}";

        $pdf = Pdf::loadView('receipts.payment', compact('data', 'doc'))
            ->setPaper([0, 0, 340, 720], 'portrait');

        Storage::disk('local')->put($path, $pdf->output());

        $invoice->update([
            'pdf_disk' => 'local',
            'pdf_path' => $path,
            'pdf_generated_at' => now(),
        ]);

        return $invoice->fresh();
    }

    /**
     * Consolidated folio invoice (lodging + incidentals) on the private disk.
     *
     * @param  array<string, mixed>  $folioSummary
     */
    public function generateFolioConsolidatedPdf(Invoice $invoice, Booking $booking, array $folioSummary): Invoice
    {
        $booking->loadMissing(['user', 'resort', 'rooms.roomType', 'payments']);
        $totals = $folioSummary['totals'] ?? [];
        $lines = array_merge(
            $folioSummary['room_charges'] ?? [],
            array_map(fn ($row) => [
                'type' => $row['charge_type'] ?? 'incidental',
                'description' => $row['description'] ?? '',
                'quantity' => $row['quantity'] ?? 1,
                'unit_price' => $row['unit_price'] ?? 0,
                'amount' => $row['amount'] ?? 0,
            ], $folioSummary['incidental_charges'] ?? [])
        );

        $payment = $booking->payments()->where('status', 'paid')->latest()->first();
        $data = $payment
            ? $this->buildReceiptData($payment)
            : [
                'payment_id' => $invoice->invoice_number,
                'source' => 'resort',
                'status' => $invoice->status,
                'amount' => $totals['charges_total'] ?? 0,
                'guest' => ['name' => $booking->user?->name, 'email' => $booking->user?->email],
            ];

        $doc = [
            'invoice' => [
                'invoice_number' => $invoice->invoice_number,
                'status' => $invoice->status,
                'issued_at' => ($invoice->issued_at ?? now())->toIso8601String(),
            ],
            'booking' => [
                'booking_code' => $booking->booking_code,
                'status' => $booking->status,
                'resort' => ['name' => $booking->resort?->name],
            ],
            'guest' => $data['guest'] ?? null,
            'stay' => [
                'check_in' => $booking->check_in?->toIso8601String(),
                'check_out' => $booking->check_out?->toIso8601String(),
            ],
            'line_items' => $lines,
            'breakdown' => [
                'subtotal' => $totals['lodging_subtotal'] ?? 0,
                'discount' => $totals['lodging_discount'] ?? 0,
                'tax' => ($totals['lodging_tax'] ?? 0),
                'service_charge' => ($totals['lodging_service'] ?? 0),
                'incidentals' => $totals['incidentals_total'] ?? 0,
                'total' => $totals['charges_total'] ?? 0,
                'paid' => $totals['net_paid'] ?? 0,
                'balance' => $totals['balance_due'] ?? 0,
            ],
        ];

        $filename = preg_replace('/[^A-Za-z0-9._-]+/', '_', $invoice->invoice_number).'.pdf';
        $path = "invoices/{$invoice->id}/{$filename}";

        $pdf = Pdf::loadView('receipts.payment', compact('data', 'doc'))
            ->setPaper([0, 0, 340, 720], 'portrait');

        Storage::disk('local')->put($path, $pdf->output());

        $invoice->update([
            'pdf_disk' => 'local',
            'pdf_path' => $path,
            'pdf_generated_at' => now(),
        ]);

        return $invoice->fresh();
    }

    /**
     * Write audit log to existing activity_logs table.
     */
    public function auditLog(int $userId, string $action, Payment $payment, string $ip = ''): void
    {
        ActivityLog::create([
            'user_id'     => $userId,
            'action'      => $action,
            'model_type'  => Payment::class,
            'model_id'    => $payment->id,
            'description' => "User #{$userId} {$action} for payment " . ($payment->payment_id ?? "PAY-{$payment->id}"),
            'ip_address'  => $ip ?: null,
        ]);
    }

    private function resolveBookingNights(Booking $booking): int
    {
        return (int) ($booking->nights ?: ($booking->check_in && $booking->check_out
            ? max(1, $booking->check_in->diffInDays($booking->check_out))
            : 0));
    }

    /**
     * Room lines for invoices/receipts (booking_rooms snapshot; no images).
     *
     * @return array<int, array<string, mixed>>
     */
    private function mapBookingRoomsForDocument(Booking $booking): array
    {
        $nights = $this->resolveBookingNights($booking);
        $resortName = $booking->resort?->name;

        return $booking->rooms?->map(function ($r) use ($nights, $resortName) {
            $type = $r->roomType;

            return [
                'room_number'      => $r->room_number,
                'room_type'        => $type?->name,
                'resort'           => $resortName,
                'branch'           => $r->branch?->name,
                'floor'            => $r->floor,
                'view'             => $r->view,
                'bed_type'         => $type?->bed_type,
                'capacity'         => $type?->max_occupancy,
                'room_status'      => $r->status,
                'amenities'        => $this->normalizeAmenities($type?->amenities),
                'price_per_night'  => (float) ($r->pivot->price_per_night ?? $r->price_per_night),
                'nights'           => (int) ($r->pivot->nights ?? $nights),
                'subtotal'         => (float) ($r->pivot->subtotal ?? 0),
                'discount_percent' => (float) ($r->pivot->discount_percent ?? 0),
                'discount_amount'  => (float) ($r->pivot->discount_amount ?? 0),
                'net_subtotal'     => (float) ($r->pivot->net_subtotal ?? $r->pivot->subtotal ?? 0),
            ];
        })->values()->toArray() ?? [];
    }

    /**
     * @param  mixed  $amenities
     * @return array<int, string>
     */
    private function normalizeAmenities($amenities): array
    {
        if (! is_array($amenities)) {
            return [];
        }

        $out = [];
        foreach ($amenities as $item) {
            if (is_string($item) && $item !== '') {
                $out[] = $item;
            } elseif (is_array($item)) {
                $label = $item['name'] ?? $item['label'] ?? $item['title'] ?? null;
                if (is_string($label) && $label !== '') {
                    $out[] = $label;
                }
            }
        }

        return array_values(array_unique($out));
    }
}
