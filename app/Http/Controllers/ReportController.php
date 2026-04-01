<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\AuditLog;
use App\Models\User;
use App\Models\Recording;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;

class ReportController extends Controller
{
    public function getUsers()
    {
        return response()->json(User::select('id', 'name')->orderBy('name')->get());
    }

    private function processData($request)
    {
        $query = DB::table('audit_logs')
            ->whereIn('action', ['Indexación', 'Descarga', 'Descarga ZIP', 'Descarga ZIP Folder']);

        if ($request->filled('dateFrom') && $request->filled('dateTo')) {
            $from = Carbon::parse($request->dateFrom)->startOfDay();
            $to   = Carbon::parse($request->dateTo)->endOfDay();
            $query->whereBetween('created_at', [$from, $to]);
        } elseif ($request->filled('dateFrom')) {
            $query->where('created_at', '>=', Carbon::parse($request->dateFrom)->startOfDay());
        } elseif ($request->filled('dateTo')) {
            $query->where('created_at', '<=', Carbon::parse($request->dateTo)->endOfDay());
        }

        if ($request->filled('userId')) {
            $query->where('user_id', $request->userId);
        }

        // ✅ PostgreSQL compatible
        $stats = $query->select(
                DB::raw('DATE(created_at) as raw_date'),
                'user_id',
                'action',
                DB::raw('COUNT(*) as occurrences'),
                DB::raw("SUM(
                    CASE
                        WHEN action = 'Indexación' AND metadata IS NOT NULL
                        THEN COALESCE(CAST(metadata::json->>'total' AS INTEGER), 0)
                        ELSE 0
                    END
                ) as indexed_count")
            )
            ->groupBy(DB::raw('DATE(created_at)'), 'user_id', 'action')
            ->orderBy('raw_date', 'desc')
            ->get();

        $userIds  = $stats->pluck('user_id')->filter()->unique();
        $usersMap = User::whereIn('id', $userIds)->pluck('name', 'id');

        $grouped = [];
        $totals  = [
            'total'       => 0,
            'descargadas' => 0,
            'zip'         => 0,
            'current_db'  => Recording::count()
        ];

        foreach ($stats as $row) {
            $date   = $row->raw_date;
            $userId = $row->user_id ?? 0;
            $key    = $date . '_' . $userId;

            if (!isset($grouped[$key])) {
                $grouped[$key] = [
                    'id'               => $key,
                    'fecha'            => $date,
                    'agente'           => $userId ? ($usersMap[$userId] ?? 'Usuario Eliminado') : 'Sistema Automático',
                    'totalGrabaciones' => 0,
                    'descargadas'      => 0,
                    'zipGenerados'     => 0
                ];
            }

            if ($row->action === 'Indexación') {
                $count = (int) $row->indexed_count;
                $grouped[$key]['totalGrabaciones'] += $count;
                $totals['total'] += $count;
            } elseif ($row->action === 'Descarga') {
                $count = (int) $row->occurrences;
                $grouped[$key]['descargadas'] += $count;
                $totals['descargadas'] += $count;
            } elseif (str_contains($row->action, 'ZIP')) {
                $count = (int) $row->occurrences;
                $grouped[$key]['zipGenerados'] += $count;
                $totals['zip'] += $count;
            }
        }

        return ['data' => array_values($grouped), 'stats' => $totals];
    }

    public function getData(Request $request)
    {
        $result = $this->processData($request);
        return response()->json($result);
    }

    public function downloadPdf(Request $request)
    {
        $result = $this->processData($request);

        $pdf = Pdf::loadView('reports.pdf', [
            'data'  => $result['data'],
            'stats' => $result['stats']
        ]);

        return $pdf->download('reporte_gestion.pdf');
    }
}
