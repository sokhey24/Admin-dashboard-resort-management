<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\DailyAuditReport;
use App\Services\NightAuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NightAuditController extends Controller
{
    public function __construct(protected NightAuditService $nightAudit) {}

    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
            'resort_id' => 'nullable|integer|exists:resorts,id',
            'branch_id' => 'nullable|integer|exists:branches,id',
            'status' => 'nullable|string|in:pending,running,completed,failed',
            'page' => 'sometimes|integer|min:1',
            'per_page' => 'sometimes|integer|min:1|max:50',
        ]);

        $payload = $this->nightAudit->listReports($validated, $request->user());

        return response()->json([
            'success' => true,
            'data' => $payload,
        ]);
    }

    public function run(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'date' => 'nullable|date_format:Y-m-d',
            'branch_id' => 'nullable|integer|exists:branches,id',
            'confirm' => 'required|accepted',
        ]);

        $reports = $this->nightAudit->run(
            $validated['date'] ?? null,
            isset($validated['branch_id']) ? (int) $validated['branch_id'] : null,
            $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => 'Night audit completed.',
            'data' => [
                'reports' => $reports->map(fn (DailyAuditReport $r) => $this->serializeReport($r)),
            ],
        ]);
    }

    protected function serializeReport(DailyAuditReport $report): array
    {
        return [
            'id' => $report->id,
            'operational_date' => $report->operational_date?->toDateString(),
            'resort_id' => $report->resort_id,
            'branch_id' => $report->branch_id,
            'branch_name' => $report->branch?->name,
            'currency' => $report->currency,
            'total_rooms' => $report->total_rooms,
            'sellable_rooms' => $report->sellable_rooms,
            'occupied_rooms' => $report->occupied_rooms,
            'maintenance_rooms' => $report->maintenance_rooms,
            'available_rooms' => $report->available_rooms,
            'occupancy_rate' => (float) $report->occupancy_rate,
            'room_revenue' => (float) $report->room_revenue,
            'incidental_revenue' => (float) $report->incidental_revenue,
            'adr' => (float) $report->adr,
            'revpar' => (float) $report->revpar,
            'arrivals' => $report->arrivals,
            'departures' => $report->departures,
            'no_show_count' => $report->no_show_count,
            'status' => $report->status,
            'error_message' => $report->error_message,
            'run_count' => $report->run_count,
            'generated_at' => $report->generated_at?->toIso8601String(),
        ];
    }
}
