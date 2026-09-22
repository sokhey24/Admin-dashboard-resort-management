<?php

namespace App\Http\Controllers\Api\Payment;

use App\Http\Controllers\Controller;
use App\Models\PaymentTransaction;
use Illuminate\Http\JsonResponse;

class TransactionController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(PaymentTransaction::with('payment')->get());
    }

    public function show(PaymentTransaction $paymentTransaction): JsonResponse
    {
        return response()->json($paymentTransaction->load('payment'));
    }
}
