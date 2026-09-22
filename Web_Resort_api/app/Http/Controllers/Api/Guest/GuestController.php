<?php

namespace App\Http\Controllers\Api\Guest;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class GuestController extends Controller
{
    public function index(): JsonResponse
    {
        $users = User::with('roles')->orderBy('name')->get(['id', 'name', 'email', 'phone', 'status']);

        return response()->json(['data' => $users]);
    }

    public function show(User $user): JsonResponse
    {
        return response()->json($user->load('bookings'));
    }
}
