<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Services\ReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function __construct(protected ReportService $reports) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $this->validatedFilters($request);
        $page = max(1, (int) $request->input('page', 1));
        $perPage = min(100, max(1, (int) $request->input('per_page', 15)));

        return response()->json([
            'success' => true,
            'data'    => $this->reports->fullReport($filters, $request->user(), $page, $perPage),
        ]);
    }

    public function bookings(Request $request): JsonResponse
    {
        $filters = $this->validatedFilters($request);

        return response()->json([
            'success' => true,
            'data'    => $this->reports->bookingsReport($filters, $request->user()),
        ]);
    }

    public function revenue(Request $request): JsonResponse
    {
        $filters = $this->validatedFilters($request);

        return response()->json([
            'success' => true,
            'data'    => $this->reports->revenueReport($filters, $request->user()),
        ]);
    }

    public function rooms(Request $request): JsonResponse
    {
        $filters = $this->validatedFilters($request);

        return response()->json([
            'success' => true,
            'data'    => $this->reports->roomsReport($filters, $request->user()),
        ]);
    }

    public function guests(Request $request): JsonResponse
    {
        $filters = $this->validatedFilters($request);

        return response()->json([
            'success' => true,
            'data'    => $this->reports->guestsReport($filters, $request->user()),
        ]);
    }

    public function daily(Request $request): JsonResponse
    {
        $filters = $this->validatedFilters($request);
        $page = max(1, (int) $request->input('page', 1));
        $perPage = min(100, max(1, (int) $request->input('per_page', 15)));

        return response()->json([
            'success' => true,
            'data'    => $this->reports->dailyBreakdown($filters, $request->user(), $page, $perPage),
        ]);
    }

    public function exportCsv(Request $request): StreamedResponse
    {
        $filters = $this->validatedFilters($request);
        $rows = $this->reports->dailyBreakdown($filters, $request->user(), 1, 10000)['rows'] ?? [];

        $branchName = 'All branches';
        if (! empty($filters['branch_id'])) {
            $branchName = Branch::query()->whereKey((int) $filters['branch_id'])->value('name')
                ?? 'Branch #'.$filters['branch_id'];
        }

        $filename = 'resort-report-'.($filters['date_from'] ?? 'all').'-to-'.($filters['date_to'] ?? 'all').'.csv';

        return response()->streamDownload(function () use ($rows, $branchName) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['Branch Name', 'Date', 'Bookings', 'Guests', 'Revenue', 'Paid', 'Pending', 'Active stays']);
            foreach ($rows as $row) {
                fputcsv($out, [
                    $branchName,
                    $row['date'],
                    $row['bookings'],
                    $row['guests'],
                    $row['revenue'],
                    $row['paid'],
                    $row['pending'],
                    $row['active_stays'],
                ]);
            }
            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }

    /** @return array<string, mixed> */
    protected function validatedFilters(Request $request): array
    {
        $request->validate([
            'date_from'  => 'nullable|date',
            'date_to'    => 'nullable|date|after_or_equal:date_from',
            'resort_id'  => 'nullable|integer|exists:resorts,id',
            'branch_id'  => 'nullable|integer|exists:branches,id',
            'page'       => 'sometimes|integer|min:1',
            'per_page'   => 'sometimes|integer|min:1|max:100',
        ]);

        return $request->only(['date_from', 'date_to', 'resort_id', 'branch_id']);
    }
}
