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
        // 1. OBTENER RANGO DE TIEMPO (Default: mes)
        $range = $request->input('range', 'month');
        $startDate = Carbon::now();

        switch ($range) {
            case 'day':
                $startDate = Carbon::today(); // Desde las 00:00 de hoy
                break;
            case 'week':
                $startDate = Carbon::now()->subDays(7); // Últimos 7 días
                break;
            case 'month':
            default:
                $startDate = Carbon::now()->subDays(30); // Últimos 30 días
                break;
        }

        // 2. KPIS (Estos siempre son globales o del día actual)
        $totalFiles = Recording::count();
        $totalSize = Recording::sum('size');
        $activeUsers = User::where('is_active', true)->count();
        $downloadsToday = AuditLog::whereDate('created_at', Carbon::today())
                                  ->whereIn('action', ['Descarga', 'Descarga ZIP'])
                                  ->count();

        // 3. GRÁFICO 1: TOP DESCARGAS (FILTRADO POR TIEMPO)
        $realCampaigns = Recording::select('campana')
                                  ->whereNotNull('campana')
                                  ->where('campana', '!=', '')
                                  ->distinct()
                                  ->pluck('campana')
                                  ->toArray();

        // --- AQUÍ USAMOS LA FECHA DINÁMICA ($startDate) ---
        $logs = AuditLog::whereIn('action', ['Descarga', 'Descarga ZIP'])
                        ->where('created_at', '>=', $startDate)
                        ->pluck('details');

        $campaignStats = array_fill_keys($realCampaigns, 0);

        foreach ($logs as $detail) {
            foreach ($realCampaigns as $camp) {
                if (stripos($detail, $camp) !== false) {
                    $campaignStats[$camp]++;
                }
            }
        }
        
        arsort($campaignStats);
        if (empty($campaignStats)) $campaignStats = ['Sin datos' => 0];

        // 4. GRÁFICO 2: DONA (Global - Inventario total)
        $pieStats = Recording::select('campana', DB::raw('count(*) as total'))
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

        // 5. ACTIVIDAD
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
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= pow(1024, $pow);
        return round($bytes, $precision) . ' ' . $units[$pow];
    }
}