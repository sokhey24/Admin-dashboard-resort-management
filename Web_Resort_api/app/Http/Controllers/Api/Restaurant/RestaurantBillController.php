<?php

namespace App\Http\Controllers\Api\Restaurant;

use App\Http\Controllers\Controller;
use App\Models\RestaurantBill;
use Illuminate\Http\JsonResponse;

class RestaurantBillController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(RestaurantBill::with('order')->get());
    }

    public function show(RestaurantBill $restaurantBill): JsonResponse
    {
        return response()->json($restaurantBill->load('order'));
    }
}
