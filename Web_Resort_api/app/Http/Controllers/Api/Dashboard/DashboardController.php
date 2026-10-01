<?php

namespace App\Http\Controllers\Api\Dashboard;

use App\Http\Controllers\Controller;
use App\Services\AdminDashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    public function __construct(
        protected AdminDashboardService $service) {}

    public function index(Request $request): JsonResponse
    {
        $filters = [
            'date'       => $request->query('date'),
            'month'      => $request->query('month'),
            'year'       => $request->query('year'),
            'branch_id'  => $request->query('branch_id'),
            'resort_id'  => $request->query('resort_id'),
        ];

        return response()->json([
            'success' => true,
            'data'    => $this->service->getSummary($filters, Auth::user()),
        ]);
    }
}
