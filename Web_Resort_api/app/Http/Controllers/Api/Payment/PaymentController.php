<?php

namespace App\Http\Controllers\Api\Payment;

use App\Http\Controllers\Controller;
use App\Models\FoodOrder;
use App\Models\Payment;
use App\Services\PaymentReceiptService;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct(
        protected PaymentReceiptService $receiptService,
        protected PaymentService $payments,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'page' => 'sometimes|integer|min:1',
            'per_page' => 'sometimes|integer|min:1|max:50',
            'search' => 'nullable|string|max:255',
            'status' => 'nullable|in:all,pending,paid,failed,refunded',
            'source' => 'nullable|in:resort,restaurant,all',
            'payment_method' => 'nullable|string|max:50',
            'resort_id' => 'nullable|integer|exists:resorts,id',
            'booking_id' => 'nullable|integer|exists:bookings,id',
            'date' => 'nullable|date',
            'month' => 'nullable|integer|min:1|max:12',
            'year' => 'nullable|integer|min:2000',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
        ]);

        $filters = $request->only([
            'page', 'per_page', 'search', 'status', 'payment_method',
            'source', 'resort_id', 'booking_id', 'date', 'month', 'year', 'date_from', 'date_to',
        ]);
        $filters['source'] = $request->input('source', 'resort');

        $paginator = $this->payments->paginate($filters, $request->user());
        $payload = $paginator->toArray();
        $payload['data'] = collect($paginator->items())
            ->map(fn (Payment $p) => $this->receiptService->buildReceiptData($p))
            ->values();
        $payload['stats'] = $this->payments->stats($filters, $request->user());

        return response()->json($payload);
    }

    public function show(Request $request, Payment $payment): JsonResponse
    {
        $this->payments->assertAccessible($payment, $request->user());

        $data = $this->receiptService->buildReceiptData($payment, $request->user()->name);
        $this->receiptService->auditLog($request->user()->id, 'viewed payment', $payment, $request->ip());

        return response()->json(['data' => $data]);
    }

    public function receipt(Request $request, Payment $payment): JsonResponse
    {
        $this->payments->assertAccessible($payment, $request->user());

        return response()->json([
            'data' => $this->receiptService->buildReceiptData($payment, $request->user()->name),
        ]);
    }

    public function receiptPdf(Request $request, Payment $payment): JsonResponse
    {
        $this->payments->assertAccessible($payment, $request->user());

        try {
            $result = $this->receiptService->generatePdf($payment, $request->user()->name);
            $this->receiptService->auditLog($request->user()->id, 'generated PDF', $payment, $request->ip());

            return response()->json([
                'success' => true,
                'filename' => $result['filename'],
                'url' => $result['url'],
            ]);
        } catch (\Throwable $e) {
            report($e);

            return response()->json(['errors' => ['message' => 'Unable to generate payment receipt.']], 500);
        }
    }

    public function printReceipt(Request $request, Payment $payment): JsonResponse
    {
        $this->payments->assertAccessible($payment, $request->user());
        $this->receiptService->auditLog($request->user()->id, 'printed receipt', $payment, $request->ip());

        return response()->json(['success' => true]);
    }

    public function refund(Request $request, Payment $payment): JsonResponse
    {
        $this->payments->assertAccessible($payment, $request->user());

        $request->validate([
            'refund_amount' => ['required', 'numeric', 'min:0.01'],
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $updated = $this->payments->refund(
            $payment,
            (float) $request->refund_amount,
            $request->user(),
            $request->reason
        );

        $this->receiptService->auditLog($request->user()->id, 'processed refund', $updated, $request->ip());

        return response()->json([
            'success' => true,
            'data' => $this->receiptService->buildReceiptData($updated),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $source = $request->input('source', 'resort');

        if ($source === 'restaurant') {
            return $this->storeLegacy($request);
        }

        $validated = $request->validate([
            'booking_id' => 'required_without:reference_id|integer|exists:bookings,id',
            'reference_id' => 'required_without:booking_id|integer|exists:bookings,id',
            'payment_method' => 'required|string|max:50',
            'method' => 'nullable|string|max:50',
            'gateway' => 'nullable|string|max:50',
            'payment_reference' => 'nullable|string|max:100',
            'currency' => 'nullable|string|max:10',
            'status' => 'nullable|in:pending,paid,failed,refunded',
            'amount' => 'nullable|numeric|min:0.01',
            'note' => 'nullable|string|max:1000',
        ]);

        $payment = $this->payments->createResortPayment($validated, $request->user());
        $this->receiptService->auditLog($request->user()->id, 'created payment', $payment, $request->ip());

        return response()->json([
            'data' => $this->receiptService->buildReceiptData($payment),
        ], 201);
    }

    public function update(Request $request, Payment $payment): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['sometimes', 'in:pending,paid,failed,refunded'],
            'paid_at' => ['nullable', 'date'],
            'note' => ['nullable', 'string', 'max:1000'],
        ]);
        $validated['updated_by'] = $request->user()->id;
        $payment->update($validated);

        return response()->json(['data' => $this->receiptService->buildReceiptData($payment)]);
    }

    public function destroy(Payment $payment): JsonResponse
    {
        $payment->delete();

        return response()->json(['success' => true]);
    }

    /** Existing restaurant payment create path — unchanged food/order tables. */
    private function storeLegacy(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'source' => ['required', 'in:restaurant'],
            'reference_id' => ['required', 'integer'],
            'user_id' => ['required', 'exists:users,id'],
            'currency' => ['nullable', 'string', 'max:10'],
            'payment_method' => ['required', 'string', 'max:50'],
            'gateway' => ['nullable', 'string', 'max:50'],
            'payment_reference' => ['nullable', 'string', 'max:100'],
            'status' => ['required', 'in:pending,paid,failed,refunded'],
            'paid_at' => ['nullable', 'date'],
            'subtotal' => ['nullable', 'numeric', 'min:0'],
            'discount' => ['nullable', 'numeric', 'min:0'],
            'tax' => ['nullable', 'numeric', 'min:0'],
            'service_charge' => ['nullable', 'numeric', 'min:0'],
        ]);

        $validated['reference_type'] = FoodOrder::class;
        $validated['created_by'] = $request->user()->id;
        $subtotal = (float) ($validated['subtotal'] ?? 0);
        $discount = (float) ($validated['discount'] ?? 0);
        $tax = (float) ($validated['tax'] ?? 0);
        $serviceCharge = (float) ($validated['service_charge'] ?? 0);
        $validated['amount'] = $subtotal - $discount + $tax + $serviceCharge;
        $validated['paid_amount'] = $validated['status'] === 'paid' ? $validated['amount'] : 0;
        $validated['balance'] = $validated['amount'] - $validated['paid_amount'];

        $payment = Payment::create($validated);

        return response()->json([
            'data' => $this->receiptService->buildReceiptData($payment),
        ], 201);
    }
}
