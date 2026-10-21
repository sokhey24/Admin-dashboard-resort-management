<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateGuestInquiryStatusRequest;
use App\Models\ActivityBooking;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ActivityBookingAdminController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min(max((int) $request->query('per_page', 15), 1), 100);

        $query = ActivityBooking::query()->latest();

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($search = trim((string) $request->query('search', ''))) {
            $query->where(function ($q) use ($search) {
                $q->where('guest_name', 'like', "%{$search}%")
                    ->orWhere('guest_email', 'like', "%{$search}%")
                    ->orWhere('activity_title', 'like', "%{$search}%");
            });
        }

        $paginator = $query->paginate($perPage);

        return response()->json([
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function show(ActivityBooking $activityBooking): JsonResponse
    {
        return response()->json(['data' => $activityBooking]);
    }

    public function update(UpdateGuestInquiryStatusRequest $request, ActivityBooking $activityBooking): JsonResponse
    {
        $activityBooking->update($request->validated());

        return response()->json(['data' => $activityBooking->fresh()]);
    }
}
