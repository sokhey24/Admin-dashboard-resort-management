<?php

namespace App\Http\Controllers\Api\Booking;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Services\BookingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class BookingController extends Controller
{
    public function __construct(protected BookingService $service) {}

    public function index(Request $request): JsonResponse
    {
        $q = Booking::with(['user', 'rooms.roomType', 'resort', 'payment', 'payments', 'invoice']);
        $this->service->applyResortScope($q, $request->user());

        if ($date = $request->query('date')) {
            $q->whereDate('created_at', $date);
        } elseif ($month = $request->query('month')) {
            $q->whereMonth('created_at', $month)
              ->whereYear('created_at', $request->query('year', now()->year));
        } elseif ($year = $request->query('year')) {
            $q->whereYear('created_at', $year);
        }

        if ($status = $request->query('status')) {
            $q->where('status', $status);
        }

        if ($request->query('filter') === 'checkin_today') {
            $q->where(function ($q) {
                $q->where('status', 'checked_in')
                  ->orWhere(function ($q) {
                      $q->whereIn('status', ['pending', 'confirmed'])
                        ->whereDate('check_in', '<=', today())
                        ->whereDate('check_out', '>=', today());
                  });
            });
        } elseif ($request->query('filter') === 'checkout_today') {
            $q->where(function ($q) {
                $q->where('status', 'checked_in')
                  ->orWhere(function ($q) {
                      $q->where('status', 'completed')
                        ->where(function ($q) {
                            $q->whereDate('check_out', today())
                              ->orWhereDate('checked_out_at', today())
                              ->orWhereDate('completed_at', today());
                        });
                  });
            });
        }

        return response()->json(['data' => $q->latest()->get()]);
    }

    public function show(Request $request, Booking $booking): JsonResponse
    {
        $this->service->assertAccessible($booking, $request->user());

        return response()->json($booking->load(['user', 'rooms.roomType', 'resort', 'payment', 'payments', 'invoice', 'statusLogs']));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'user_id' => 'nullable|exists:users,id',
            'resort_id' => 'required|exists:resorts,id',
            'coupon_id' => 'nullable|exists:coupons,id',
            'adults' => 'nullable|integer|min:1',
            'children' => 'nullable|integer|min:0',
            'check_in' => 'required|date',
            'check_out' => 'required|date|after:check_in',
            // Room discount is derived from the catalogue, never accepted here.
            // Tax and service charge default to config and may only be overridden
            // by staff on this authenticated route.
            'coupon_code' => 'nullable|string|max:50',
            'tax_amount' => 'nullable|numeric|min:0',
            'service_charge_amount' => 'nullable|numeric|min:0',
            'special_requests' => 'nullable|string',
            'room_ids' => 'required|array|min:1',
            'room_ids.*' => 'exists:rooms,id',
            'source' => 'nullable|in:walk_in,website,phone,ota,staff',
        ]);

        $user = $request->user();
        if ($user?->isGuestAccount()) {
            unset($data['user_id'], $data['tax_amount'], $data['service_charge_amount']);
        }

        $this->assertResortAccess((int) $data['resort_id'], $request->user());

        $booking = $this->service->createBooking($data, $request->user());

        return response()->json(['data' => $booking->load(['user', 'rooms.roomType', 'resort', 'payment', 'payments', 'invoice'])], 201);
    }

    public function update(Request $request, Booking $booking): JsonResponse
    {
        $this->service->assertAccessible($booking, $request->user());

        $data = $request->validate([
            'user_id' => 'sometimes|exists:users,id',
            'resort_id' => 'sometimes|exists:resorts,id',
            'coupon_id' => 'nullable|exists:coupons,id',
            'adults' => 'nullable|integer|min:1',
            'children' => 'nullable|integer|min:0',
            'coupon_code' => 'nullable|string|max:50',
            'tax_amount' => 'nullable|numeric|min:0',
            'service_charge_amount' => 'nullable|numeric|min:0',
            'check_in' => 'sometimes|date',
            'check_out' => 'sometimes|date',
            'status' => 'sometimes|in:pending,confirmed,checked_in,checked_out,cancelled,completed',
            'cancellation_reason' => 'nullable|string|max:500',
            'special_requests' => 'nullable|string',
            'room_ids' => 'nullable|array',
            'room_ids.*' => 'exists:rooms,id',
        ]);

        if (isset($data['resort_id'])) {
            $this->assertResortAccess((int) $data['resort_id'], $request->user());
        }

        $booking = $this->service->updateBooking($booking, $data, $request->user());

        return response()->json(['data' => $booking->load(['user', 'rooms.roomType', 'resort', 'payment', 'payments', 'invoice'])]);
    }

    public function destroy(Request $request, Booking $booking): JsonResponse
    {
        $this->service->assertAccessible($booking, $request->user());
        $this->service->deleteBooking($booking);

        return response()->json(null, 204);
    }

    protected function assertResortAccess(int $resortId, $user): void
    {
        if (! $user || $user->isAdmin()) {
            return;
        }
        $assigned = $user->assignedResortIds();
        if ($assigned !== [] && ! in_array($resortId, $assigned, true)) {
            throw ValidationException::withMessages(['resort_id' => ['This resort is not assigned to you.']]);
        }
    }
}
