<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateGuestInquiryStatusRequest;
use App\Http\Resources\ContactInquiryResource;
use App\Models\ContactInquiry;
use App\Services\GuestInquiryScopeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContactInquiryAdminController extends Controller
{
    public function __construct(protected GuestInquiryScopeService $scope) {}

    public function index(Request $request): JsonResponse
    {
        $perPage = min(max((int) $request->query('per_page', 15), 1), 100);
        $branchId = $request->filled('branch_id') ? (int) $request->query('branch_id') : null;

        $query = ContactInquiry::query()->latest();
        $this->scope->applyResortNameScope($query, $request->user(), 'resort_name', $branchId);

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($search = trim((string) $request->query('search', ''))) {
            $query->where(function ($q) use ($search) {
                $q->where('guest_name', 'like', "%{$search}%")
                    ->orWhere('guest_email', 'like', "%{$search}%")
                    ->orWhere('resort_name', 'like', "%{$search}%")
                    ->orWhere('message', 'like', "%{$search}%");
            });
        }

        $paginator = $query->paginate($perPage);

        return response()->json([
            'data' => ContactInquiryResource::collection($paginator->items())->resolve(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function show(Request $request, ContactInquiry $contactInquiry): JsonResponse
    {
        $this->scope->assertResortInquiryAccessible($contactInquiry, $request->user());

        return response()->json(['data' => (new ContactInquiryResource($contactInquiry))->resolve()]);
    }

    public function update(
        UpdateGuestInquiryStatusRequest $request,
        ContactInquiry $contactInquiry
    ): JsonResponse {
        $this->scope->assertResortInquiryAccessible($contactInquiry, $request->user());

        $contactInquiry->update($request->validated());

        return response()->json(['data' => (new ContactInquiryResource($contactInquiry->fresh()))->resolve()]);
    }
}
