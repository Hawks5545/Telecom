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

    // Lógica central HIPER-OPTIMIZADA para bases de datos masivas
    private function processData($request)
    {
        $query = DB::table('audit_logs')
            ->whereIn('action', ['Indexación', 'Descarga', 'Descarga ZIP', 'Descarga ZIP Folder']);

        // --- 1. FILTROS DE FECHA EXACTOS ---
        if ($request->filled('dateFrom') && $request->filled('dateTo')) {
            $from = Carbon::parse($request->dateFrom)->startOfDay(); 
            $to = Carbon::parse($request->dateTo)->endOfDay();       
            $query->whereBetween('created_at', [$from, $to]);
        } elseif ($request->filled('dateFrom')) {
            $from = Carbon::parse($request->dateFrom)->startOfDay();
            $query->where('created_at', '>=', $from);
        } elseif ($request->filled('dateTo')) {
            $to = Carbon::parse($request->dateTo)->endOfDay();
            $query->where('created_at', '<=', $to);
        }

        if ($request->filled('userId')) {
            $query->where('user_id', $request->userId);
        }

        // --- 2. LA MAGIA DE MYSQL 8: Agrupación y Suma Nativa ---
        // Reducimos millones de filas a unas pocas decenas directamente en la Base de Datos
        $stats = $query->select(
                DB::raw('DATE(created_at) as raw_date'),
                'user_id',
                'action',
                DB::raw('COUNT(*) as occurrences'), // Cuenta las descargas
                DB::raw("SUM(
                    CASE 
                        WHEN action = 'Indexación' AND metadata IS NOT NULL 
                        THEN CAST(JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.total')) AS UNSIGNED) 
                        ELSE 0 
                    END
                ) as indexed_count") // Suma directamente desde el JSON
            )
            ->groupBy(DB::raw('DATE(created_at)'), 'user_id', 'action')
            ->orderBy('raw_date', 'desc')
            ->get();

        // --- 3. TRAER NOMBRES DE USUARIO (Evitamos N+1) ---
        $userIds = $stats->pluck('user_id')->filter()->unique();
        $usersMap = User::whereIn('id', $userIds)->pluck('name', 'id');

        // --- 4. ENSAMBLAR RESPUESTA RÁPIDA EN PHP ---
        $grouped = [];
        $totals = [
            'total' => 0, 
            'descargadas' => 0, 
            'zip' => 0, 
            'current_db' => Recording::count() // Único count masivo tolerado
        ];

        // Iterar sobre los resultados agrupados (serán muy pocos, ej: 10 o 50 filas)
        foreach ($stats as $row) {
            $date = $row->raw_date;
            $userId = $row->user_id ?? 0;
            $key = $date . '_' . $userId;

            if (!isset($grouped[$key])) {
                $grouped[$key] = [
                    'id' => $key,
                    'fecha' => $date,
                    'agente' => $userId ? ($usersMap[$userId] ?? 'Usuario Eliminado') : 'Sistema Automático',
                    'totalGrabaciones' => 0,
                    'descargadas' => 0,
                    'zipGenerados' => 0
                ];
            }

            if ($row->action === 'Indexación') {
                $count = (int)$row->indexed_count;
                $grouped[$key]['totalGrabaciones'] += $count;
                $totals['total'] += $count;
            } 
            elseif ($row->action === 'Descarga') {
                $count = (int)$row->occurrences;
                $grouped[$key]['descargadas'] += $count;
                $totals['descargadas'] += $count;
            } 
            elseif (str_contains($row->action, 'ZIP')) {
                $count = (int)$row->occurrences;
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
            'data' => $result['data'],
            'stats' => $result['stats']
        ]);

        return $pdf->download('reporte_gestion.pdf');
    }
}