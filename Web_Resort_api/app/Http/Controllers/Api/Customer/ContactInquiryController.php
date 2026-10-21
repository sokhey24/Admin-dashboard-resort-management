<?php

namespace App\Http\Controllers\Api\Customer;

use App\Events\ContactInquiryCreated;
use App\Http\Controllers\Controller;
use App\Http\Requests\Contact\StoreContactInquiryRequest;
use App\Models\ContactInquiry;
use Illuminate\Http\JsonResponse;

class ContactInquiryController extends Controller
{
    public function store(StoreContactInquiryRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $inquiry = ContactInquiry::create([
            'user_id' => $request->user()?->id,
            'guest_name' => $validated['guest_name'],
            'guest_email' => $validated['guest_email'],
            'guest_phone' => $validated['guest_phone'],
            'resort_name' => $validated['resort_name'],
            'subject' => $validated['subject'],
            'message' => $validated['message'],
            'status' => 'pending',
        ]);

        event(new ContactInquiryCreated($inquiry->id));

        return response()->json([
            'success' => true,
            'message' => 'Contact inquiry submitted successfully.',
            'data' => [
                'id' => $inquiry->id,
                'subject' => $inquiry->subject,
                'resort_name' => $inquiry->resort_name,
                'status' => $inquiry->status,
            ],
        ], 201);
    }
}
