<?php

namespace App\Http\Controllers\Api\Dashboard;

use App\Http\Controllers\Controller;
use App\Services\AdminDashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(protected AdminDashboardService $service) {}

    public function index(Request $request): JsonResponse
    {
        $filters = [
            'date'  => $request->query('date'),
            'month' => $request->query('month'),
            'year'  => $request->query('year'),
        ];

        return response()->json([
            'success' => true,
            'data'    => $this->service->getSummary($filters),
        ]);
    }
}
