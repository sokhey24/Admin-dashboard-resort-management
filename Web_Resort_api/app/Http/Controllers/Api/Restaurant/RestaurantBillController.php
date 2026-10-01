<?php

namespace App\Http\Controllers\Api\Restaurant;

use App\Http\Controllers\Controller;
use App\Models\FoodOrder;
use App\Models\RestaurantBill;
use App\Services\BranchAccessService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class RestaurantBillController extends Controller
{
    public function __construct(protected BranchAccessService $branchAccess) {}

    public function index(Request $request): JsonResponse
    {
        $bills = $this->scopedBillsQuery($request)->with('order')->get();

        return response()->json($bills);
    }

    public function show(Request $request, RestaurantBill $restaurantBill): JsonResponse
    {
        $this->assertBillAccessible($request, $restaurantBill);

        return response()->json($restaurantBill->load('order'));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'food_order_id'  => 'required|exists:food_orders,id',
            'bill_number'    => 'nullable|string|max:64|unique:restaurant_bills,bill_number',
            'subtotal'       => 'required|numeric|min:0',
            'tax'            => 'nullable|numeric|min:0',
            'discount'       => 'nullable|numeric|min:0',
            'total'          => 'required|numeric|min:0',
            'payment_method' => 'nullable|in:cash,credit_card,qr_code,room_charge',
            'status'         => 'nullable|in:unpaid,paid,cancelled',
        ]);

        $this->assertFoodOrderAccessible($request, (int) $validated['food_order_id']);

        if (RestaurantBill::query()->where('food_order_id', $validated['food_order_id'])->exists()) {
            abort(422, 'A bill already exists for this food order.');
        }

        $validated['bill_number'] = $validated['bill_number'] ?? ('BILL-'.strtoupper(Str::random(8)));
        $validated['tax'] = $validated['tax'] ?? 0;
        $validated['discount'] = $validated['discount'] ?? 0;
        $validated['payment_method'] = $validated['payment_method'] ?? 'cash';
        $validated['status'] = $validated['status'] ?? 'unpaid';

        if ($validated['status'] === 'paid' && ! $request->filled('paid_at')) {
            $validated['paid_at'] = now();
        }

        $bill = RestaurantBill::create($validated);

        return response()->json($bill->load('order'), 201);
    }

    public function update(Request $request, RestaurantBill $restaurantBill): JsonResponse
    {
        $this->assertBillAccessible($request, $restaurantBill);

        $validated = $request->validate([
            'bill_number'    => 'sometimes|string|max:64|unique:restaurant_bills,bill_number,'.$restaurantBill->id,
            'subtotal'       => 'sometimes|numeric|min:0',
            'tax'            => 'nullable|numeric|min:0',
            'discount'       => 'nullable|numeric|min:0',
            'total'          => 'sometimes|numeric|min:0',
            'payment_method' => 'nullable|in:cash,credit_card,qr_code,room_charge',
            'status'         => 'sometimes|in:unpaid,paid,cancelled',
            'paid_at'        => 'nullable|date',
        ]);

        if (($validated['status'] ?? null) === 'paid' && ! isset($validated['paid_at']) && ! $restaurantBill->paid_at) {
            $validated['paid_at'] = now();
        }

        $restaurantBill->update($validated);

        return response()->json($restaurantBill->fresh()->load('order'));
    }

    public function destroy(Request $request, RestaurantBill $restaurantBill): JsonResponse
    {
        $this->assertBillAccessible($request, $restaurantBill);
        $restaurantBill->delete();

        return response()->json(null, 204);
    }

    protected function scopedBillsQuery(Request $request)
    {
        return RestaurantBill::query()->whereHas('order', function ($q) use ($request) {
            $this->branchAccess->applyFoodOrderBranchScope(
                $q,
                $request->user(),
                $request->input('branch_id')
            );
        });
    }

    protected function assertBillAccessible(Request $request, RestaurantBill $restaurantBill): void
    {
        if (! $this->scopedBillsQuery($request)->whereKey($restaurantBill->id)->exists()) {
            abort(403, 'You cannot access data for this branch.');
        }
    }

    protected function assertFoodOrderAccessible(Request $request, int $foodOrderId): void
    {
        $scoped = FoodOrder::query()->whereKey($foodOrderId);
        $this->branchAccess->applyFoodOrderBranchScope($scoped, $request->user(), null);

        if (! $scoped->exists()) {
            abort(403, 'You cannot access data for this branch.');
        }
    }
}
