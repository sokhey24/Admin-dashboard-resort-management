<?php

namespace App\Http\Controllers\Api\Resort;

use App\Http\Controllers\Controller;
use App\Services\ResortDashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ResortDashboardController extends Controller
{
    public function __construct(protected ResortDashboardService $service) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['date', 'month', 'year', 'resort_id']);

        return response()->json($this->service->getSummary($filters));
    }
}
