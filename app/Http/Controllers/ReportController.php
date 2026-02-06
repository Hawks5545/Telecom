<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\AuditLog;
use App\Models\User;
use App\Models\Recording; // <--- AGREGADO: Importar Modelo Recording
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf; 
use Carbon\Carbon;

class ReportController extends Controller
{
    public function getUsers()
    {
        return response()->json(User::select('id', 'name')->orderBy('name')->get());
    }

    // Lógica central para procesar los datos
    private function processData($request)
    {
        $query = AuditLog::with('user');

        // --- FILTROS DE FECHA ---
        if ($request->filled('dateFrom') && $request->filled('dateTo')) {
            $from = Carbon::parse($request->dateFrom)->startOfDay(); 
            $to = Carbon::parse($request->dateTo)->endOfDay();       
            $query->whereBetween('created_at', [$from, $to]);
        } else {
            if ($request->filled('dateFrom')) {
                $from = Carbon::parse($request->dateFrom)->startOfDay();
                $query->where('created_at', '>=', $from);
            }
            if ($request->filled('dateTo')) {
                $to = Carbon::parse($request->dateTo)->endOfDay();
                $query->where('created_at', '<=', $to);
            }
        }

        if ($request->filled('userId')) {
            $query->where('user_id', $request->userId);
        }

        $logs = $query->whereIn('action', ['Indexación', 'Descarga', 'Descarga ZIP', 'Descarga ZIP Folder'])
                      ->orderBy('created_at', 'desc')
                      ->get();

        // --- AGRUPACIÓN Y CÁLCULOS ---
        $grouped = [];
        $totals = [
            'total' => 0, 
            'descargadas' => 0, 
            'zip' => 0, 
            'current_db' => 0 // Nuevo campo
        ];

        // OBTENER EL TOTAL REAL EN BASE DE DATOS (INVENTARIO ACTUAL)
        // Este valor ignora filtros de fecha porque es el estado "Foto actual"
        $totals['current_db'] = Recording::count();

        foreach ($logs as $log) {
            $date = $log->created_at->format('Y-m-d');
            $userId = $log->user_id ?? 0;
            $key = $date . '_' . $userId;

            if (!isset($grouped[$key])) {
                $grouped[$key] = [
                    'id' => $key,
                    'fecha' => $date,
                    'agente' => $log->user ? $log->user->name : 'Usuario Eliminado',
                    'totalGrabaciones' => 0,
                    'descargadas' => 0,
                    'zipGenerados' => 0
                ];
            }

            if ($log->action === 'Indexación') {
                if (preg_match('/Nuevos: (\d+)/', $log->details, $matches)) {
                    $count = (int)$matches[1];
                    $grouped[$key]['totalGrabaciones'] += $count;
                    $totals['total'] += $count;
                }
            } elseif ($log->action === 'Descarga') {
                $grouped[$key]['descargadas'] += 1;
                $totals['descargadas'] += 1;
            } elseif (str_contains($log->action, 'ZIP')) {
                $grouped[$key]['zipGenerados'] += 1;
                $totals['zip'] += 1;
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