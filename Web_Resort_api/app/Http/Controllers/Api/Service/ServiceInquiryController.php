<?php

namespace App\Http\Controllers\Api\Service;

use App\Http\Controllers\Controller;
use App\Http\Requests\Service\StoreServiceInquiryRequest;
use App\Models\ServiceInquiry;
use Illuminate\Http\JsonResponse;

class ServiceInquiryController extends Controller
{
    public function store(StoreServiceInquiryRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $inquiry = ServiceInquiry::create([
            'user_id' => $request->user()?->id,
            'service_title' => $validated['service_title'],
            'service_id' => $validated['service_id'] ?? null,
            'preferred_date' => $validated['preferred_date'],
            'resort_name' => $validated['resort_name'],
            'guest_count' => $validated['guest_count'],
            'guest_name' => $validated['guest_name'],
            'guest_email' => $validated['guest_email'],
            'guest_phone' => $validated['guest_phone'],
            'special_requests' => $validated['special_requests'] ?? null,
            'status' => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Service inquiry submitted successfully.',
            'data' => [
                'id' => $inquiry->id,
                'service_title' => $inquiry->service_title,
                'service_id' => $inquiry->service_id,
                'preferred_date' => $inquiry->preferred_date->format('Y-m-d'),
                'resort_name' => $inquiry->resort_name,
                'guest_count' => $inquiry->guest_count,
                'guest_name' => $inquiry->guest_name,
                'guest_email' => $inquiry->guest_email,
                'guest_phone' => $inquiry->guest_phone,
                'special_requests' => $inquiry->special_requests,
                'status' => $inquiry->status,
            ],
        ], 201);
    }
}
