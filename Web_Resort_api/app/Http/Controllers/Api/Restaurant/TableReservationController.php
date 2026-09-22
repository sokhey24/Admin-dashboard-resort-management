<?php

namespace App\Http\Controllers\Api\Restaurant;

use App\Http\Controllers\Controller;
use App\Models\TableReservation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TableReservationController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(TableReservation::with(['table', 'user'])->get());
    }

    public function show(TableReservation $tableReservation): JsonResponse
    {
        return response()->json($tableReservation->load(['table', 'user']));
    }

    public function store(Request $request): JsonResponse
    {
        $reservation = TableReservation::create($request->all());
        return response()->json($reservation, 201);
    }

    public function update(Request $request, TableReservation $tableReservation): JsonResponse
    {
        $tableReservation->update($request->all());
        return response()->json($tableReservation);
    }

    public function destroy(TableReservation $tableReservation): JsonResponse
    {
        $tableReservation->delete();
        return response()->json(null, 204);
    }
}
