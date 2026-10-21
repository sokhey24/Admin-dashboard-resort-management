<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateGuestInquiryStatusRequest;
use App\Models\ServiceInquiry;
use App\Services\GuestInquiryScopeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceInquiryAdminController extends Controller
{
    public function __construct(protected GuestInquiryScopeService $scope) {}

    public function index(Request $request): JsonResponse
    {
        $perPage = min(max((int) $request->query('per_page', 15), 1), 100);
        $branchId = $request->filled('branch_id') ? (int) $request->query('branch_id') : null;

        $query = ServiceInquiry::query()->latest();
        $this->scope->applyResortNameScope($query, $request->user(), 'resort_name', $branchId);

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($search = trim((string) $request->query('search', ''))) {
            $query->where(function ($q) use ($search) {
                $q->where('guest_name', 'like', "%{$search}%")
                    ->orWhere('guest_email', 'like', "%{$search}%")
                    ->orWhere('service_title', 'like', "%{$search}%")
                    ->orWhere('resort_name', 'like', "%{$search}%");
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

    public function show(Request $request, ServiceInquiry $serviceInquiry): JsonResponse
    {
        $this->scope->assertResortInquiryAccessible($serviceInquiry, $request->user());

        return response()->json(['data' => $serviceInquiry]);
    }

    public function update(
        UpdateGuestInquiryStatusRequest $request,
        ServiceInquiry $serviceInquiry
    ): JsonResponse {
        $this->scope->assertResortInquiryAccessible($serviceInquiry, $request->user());

        $serviceInquiry->update($request->validated());

        return response()->json(['data' => $serviceInquiry->fresh()]);
    }
}
