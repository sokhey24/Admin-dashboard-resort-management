<?php

namespace App\Http\Controllers\Api\Restaurant;

use App\Http\Controllers\Controller;
use App\Services\RestaurantDashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RestaurantDashboardController extends Controller
{
    public function __construct(protected RestaurantDashboardService $service) {}

    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'branch_id' => 'nullable|integer|exists:branches,id',
        ]);

        return response()->json($this->service->getSummary(
            $request->user(),
            $request->only(['branch_id'])
        ));
    }
}
