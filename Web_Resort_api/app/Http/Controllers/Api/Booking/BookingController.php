<?php

namespace App\Http\Controllers\Api\Booking;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Services\BookingService;
use App\Services\ReviewService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class BookingController extends Controller
{
    public function __construct(protected BookingService $service) {}

    public function index(Request $request): JsonResponse
    {
        $q = Booking::with(['user', 'branch', 'rooms.roomType', 'rooms.branch', 'rooms.images', 'resort', 'coupon', 'payment', 'payments', 'invoice']);
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

        app(\App\Services\BranchAccessService::class)->applyBookingBranchScope(
            $q,
            $request->user(),
            $request->filled('branch_id') ? (int) $request->query('branch_id') : null
        );

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

        $bookings = $q->latest()->get();
        $this->attachReviewEligibility($bookings, $request->user());

        return response()->json(['data' => $bookings]);
    }

    public function show(Request $request, Booking $booking): JsonResponse
    {
        $this->service->assertAccessible($booking, $request->user());

        $booking->load(['user', 'rooms.roomType', 'rooms.branch', 'rooms.images', 'resort', 'coupon', 'payment', 'payments', 'invoice', 'statusLogs']);
        $this->attachReviewEligibility(collect([$booking]), $request->user());

        return response()->json($booking);
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
            'branch_id' => 'nullable|integer|exists:branches,id',
            'source' => 'nullable|in:walk_in,website,phone,ota,staff',
        ]);

        $user = $request->user();
        if ($user?->isGuestAccount()) {
            unset($data['user_id'], $data['tax_amount'], $data['service_charge_amount']);
        }

        $this->assertResortAccess((int) $data['resort_id'], $request->user());

        $booking = $this->service->createBooking($data, $request->user());

        return response()->json(['data' => $booking->load(['user', 'rooms.roomType', 'rooms.branch', 'rooms.images', 'resort', 'coupon', 'payment', 'payments', 'invoice'])], 201);
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

        $user = $request->user();
        if ($user?->isGuestAccount()) {
            unset(
                $data['user_id'],
                $data['resort_id'],
                $data['tax_amount'],
                $data['service_charge_amount'],
                $data['coupon_id'],
                $data['coupon_code']
            );
            if (isset($data['status']) && $data['status'] !== 'cancelled') {
                throw ValidationException::withMessages([
                    'status' => ['Guests may only cancel their own reservations.'],
                ]);
            }
        }

        if (isset($data['resort_id'])) {
            $this->assertResortAccess((int) $data['resort_id'], $request->user());
        }

        $booking = $this->service->updateBooking($booking, $data, $request->user());

        return response()->json(['data' => $booking->load(['user', 'rooms.roomType', 'rooms.branch', 'rooms.images', 'resort', 'coupon', 'payment', 'payments', 'invoice'])]);
    }

    public function destroy(Request $request, Booking $booking): JsonResponse
    {
        $this->service->assertAccessible($booking, $request->user());
        $this->service->deleteBooking($booking);

        return response()->json(null, 204);
    }

    protected function attachReviewEligibility($bookings, $user): void
    {
        if (! $user?->isGuestAccount()) {
            return;
        }

        $reviews = app(ReviewService::class);
        foreach ($bookings as $booking) {
            $booking->setAttribute(
                'review_eligibility',
                $reviews->bookingReviewEligibility($booking, $user)
            );
        }
    }

    protected function assertResortAccess(int $resortId, $user): void
    {
        if (! $user) {
            return;
        }
        // Website customers have no resort_staff assignment; they may book any public resort.
        if ($user->isGuestAccount()) {
            return;
        }
        try {
            app(\App\Services\ResortAccessService::class)->assertResortAccessible($user, $resortId);
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            throw ValidationException::withMessages(['resort_id' => ['This resort is not assigned to you.']]);
        }
    }
}
