<?php

namespace App\Services;

use App\Models\ActivityLog;
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
            $nights = (int) ($ref->nights ?: ($ref->check_in && $ref->check_out
                ? max(1, $ref->check_in->diffInDays($ref->check_out))
                : 0));
            $referenceData = [
                'booking_id'   => $ref->id,
                'booking_code' => $ref->booking_code,
                'resort'       => ['id' => $ref->resort_id, 'name' => $ref->resort?->name],
                'branch'       => ['name' => $firstRoom?->branch?->name],
                // Figures come from the booking_rooms snapshot, so a later change to
                // the room or room type discount never alters a historic receipt.
                'rooms'        => $ref->rooms?->map(fn ($r) => [
                    'room_number'      => $r->room_number,
                    'room_type'        => $r->roomType?->name,
                    'price_per_night'  => (float) ($r->pivot->price_per_night ?? $r->price_per_night),
                    'nights'           => (int) ($r->pivot->nights ?? $nights),
                    'subtotal'         => (float) ($r->pivot->subtotal ?? 0),
                    'discount_percent' => (float) ($r->pivot->discount_percent ?? 0),
                    'discount_amount'  => (float) ($r->pivot->discount_amount ?? 0),
                    'net_subtotal'     => (float) ($r->pivot->net_subtotal ?? $r->pivot->subtotal ?? 0),
                ])->toArray() ?? [],
                'check_in'     => $ref->check_in?->toIso8601String(),
                'check_out'    => $ref->check_out?->toIso8601String(),
                'nights'       => $nights,
                'status'       => $ref->status,
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
     * Generate PDF receipt and store to storage/app/public/receipts/.
     * Returns ['url' => ..., 'filename' => ...].
     */
    public function generatePdf(Payment $payment, ?string $generatedBy = null): array
    {
        $data     = $this->buildReceiptData($payment, $generatedBy);
        $isRefund = $payment->status === 'refunded';
        $isResort = ($data['source'] ?? 'resort') === 'resort';

        $filename = match (true) {
            $isRefund => "{$data['payment_id']}_Refund_Receipt.pdf",
            !$isResort => "{$data['payment_id']}_Restaurant_Payment_Receipt.pdf",
            default   => "{$data['payment_id']}_Payment_Receipt.pdf",
        };

        $pdf  = Pdf::loadView('receipts.payment', compact('data'))->setPaper('a4', 'portrait');
        $path = "public/receipts/{$filename}";
        Storage::put($path, $pdf->output());

        return [
            'filename' => $filename,
            'url'      => Storage::url("receipts/{$filename}"),
        ];
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
}
