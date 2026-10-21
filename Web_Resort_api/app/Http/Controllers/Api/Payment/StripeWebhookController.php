<?php

namespace App\Http\Controllers\Api\Payment;

use App\Http\Controllers\Controller;
use App\Services\StripePaymentService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class StripeWebhookController extends Controller
{
    public function __construct(protected StripePaymentService $stripe) {}

    public function handle(Request $request): Response
    {
        $this->stripe->handleWebhook(
            $request->getContent(),
            $request->header('Stripe-Signature')
        );

        return response('OK', 200);
    }
}
