<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Recording;
use App\Models\User;
use App\Models\AuditLog;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function getStats(Request $request)
    {
        // 1. RANGO DE TIEMPO
        $range = $request->input('range', 'month');
        $startDate = match ($range) {
            'day' => Carbon::today(),
            'week' => Carbon::now()->subDays(7),
            default => Carbon::now()->subDays(30),
        };

        // 2. KPI: TOTAL ARCHIVOS Y PESO (Optimizado)
        $recordingStats = DB::table('recordings')
            ->selectRaw('count(*) as total, sum(size) as size')
            ->first();

        $totalFiles = $recordingStats->total;
        $totalSize = $recordingStats->size ?? 0;
        $activeUsers = User::where('is_active', true)->count();
        
        // descargas hoy (KPI simple)
        $downloadsToday = AuditLog::whereDate('created_at', Carbon::today())
            ->whereIn('action', ['Descarga', 'Descarga ZIP', 'Descarga ZIP Folder'])
            ->count();


        // 3. TOP DESCARGAS POR CAMPAÑA (Lógica Mejorada para ZIPs)
        
        // Obtenemos campañas reales de la base de datos
        $realCampaigns = DB::table('recordings')
            ->whereNotNull('campana')
            ->where('campana', '!=', '')
            ->distinct()
            ->pluck('campana')
            ->toArray();

        // Traemos los logs
        $logs = DB::table('audit_logs')
            ->whereIn('action', ['Descarga', 'Descarga ZIP', 'Descarga ZIP Folder'])
            ->where('created_at', '>=', $startDate)
            ->pluck('details');

        // Inicializamos contador en 0 para todas las campañas
        $campaignStats = array_fill_keys($realCampaigns, 0);

        foreach ($logs as $detail) {
            // A. Intentamos detectar el nuevo formato de ZIP: "Campañas: {Tigo:3, Claro:2}"
            // Usamos una Expresión Regular para buscar lo que está entre llaves {}
            if (preg_match('/Campañas: \{(.*?)\}/', $detail, $matches)) {
                $content = $matches[1]; // Ejemplo: "Tigo:3, Claro:2"
                $parts = explode(',', $content);
                
                foreach ($parts as $part) {
                    // Separamos por los dos puntos
                    $piezas = explode(':', $part);
                    if (count($piezas) === 2) {
                        $nombreCampana = trim($piezas[0]);
                        $cantidad = (int) trim($piezas[1]);

                        // Sumamos la cantidad exacta a la gráfica
                        if (isset($campaignStats[$nombreCampana])) {
                            $campaignStats[$nombreCampana] += $cantidad;
                        } else {
                            // Si la campaña es nueva (no estaba en realCampaigns), la agregamos
                            $campaignStats[$nombreCampana] = $cantidad;
                        }
                    }
                }
            } 
            // B. Si no es formato ZIP nuevo, usamos la lógica antigua (Descarga individual = 1)
            else {
                foreach ($realCampaigns as $camp) {
                    if (stripos($detail, $camp) !== false) {
                        $campaignStats[$camp]++;
                        // No hacemos break porque una descarga individual solo tiene 1 campaña
                        break; 
                    }
                }
            }
        }
        
        arsort($campaignStats);
        $campaignStats = array_slice($campaignStats, 0, 10); 
        if (empty($campaignStats)) $campaignStats = ['Sin datos' => 0];


        // 4. GRÁFICO DE DONA (DISTRIBUCIÓN DE ARCHIVOS EN DISCO)
        $pieStats = DB::table('recordings')
            ->select('campana', DB::raw('count(*) as total'))
            ->whereNotNull('campana')
            ->where('campana', '!=', '')
            ->groupBy('campana')
            ->orderByDesc('total')
            ->limit(5)
            ->get();

        if ($pieStats->isEmpty()) {
            $pieLabels = ['Sin Campaña'];
            $pieData = [$totalFiles];
        } else {
            $pieLabels = $pieStats->pluck('campana');
            $pieData = $pieStats->pluck('total');
        }

        // 5. ACTIVIDAD RECIENTE
        $recentActivity = AuditLog::with('user:id,name')
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'user' => $log->user ? $log->user->name : 'Usuario Eliminado',
                    'action' => $log->action,
                    'time' => $log->created_at->diffForHumans()
                ];
            });

        return response()->json([
            'kpi' => [
                'files' => number_format($totalFiles),
                'size' => $this->formatBytes($totalSize),
                'users' => $activeUsers,
                'downloads_today' => $downloadsToday
            ],
            'charts' => [
                'campaigns' => [
                    'labels' => array_keys($campaignStats),
                    'data' => array_values($campaignStats)
                ],
                'distribution' => [
                    'labels' => $pieLabels,
                    'data' => $pieData
                ]
            ],
            'activity' => $recentActivity
        ]);
    }

    private function formatBytes($bytes, $precision = 2) {
        if ($bytes <= 0) return '0 B';
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $pow = floor(log($bytes) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= pow(1024, $pow);
        return round($bytes, $precision) . ' ' . $units[$pow];
    }
}