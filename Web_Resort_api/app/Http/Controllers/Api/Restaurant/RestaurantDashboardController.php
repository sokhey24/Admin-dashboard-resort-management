<?php

namespace App\Http\Controllers\Api\Restaurant;

use App\Http\Controllers\Controller;
use App\Services\RestaurantDashboardService;
use Illuminate\Http\JsonResponse;

class RestaurantDashboardController extends Controller
{
    public function __construct(protected RestaurantDashboardService $service) {}

    public function index(): JsonResponse
    {
        return response()->json($this->service->getSummary());
    }
}
