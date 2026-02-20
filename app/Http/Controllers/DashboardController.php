<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Recording;
use App\Models\User;
use App\Models\AuditLog;
use App\Models\StorageLocation;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class DashboardController extends Controller
{
    public function getStats(Request $request)
    {
        $allowedRanges = ['day', 'week', 'month'];
        $range = in_array($request->input('range'), $allowedRanges) ? $request->input('range') : 'month';
        
        // Version 12: Fuerza la limpieza de caché para aplicar la nueva regla de Importaciones
        $cacheKey = 'dash_stats_v12_' . $range;
        
        try {
            // 1. ACTIVIDAD RECIENTE (En vivo)
            $recentActivity = AuditLog::with('user:id,name')
                ->latest('id') 
                ->take(7)
                ->get()
                ->map(function ($log) {
                    return [
                        'id' => $log->id,
                        'user' => $log->user ? $log->user->name : 'Sistema',
                        'action' => strtoupper($log->action),
                        'details' => Str::limit($log->details, 60),
                        'time' => $log->created_at->diffForHumans()
                    ];
                });

            // 2. ESTADÍSTICAS PESADAS (Caché)
            $cacheTime = match ($range) {
                'day' => 60,
                'week' => 300,
                default => 600,
            };

            $stats = Cache::remember($cacheKey, $cacheTime, function () use ($range) {
                
                $startDate = match ($range) {
                    'day' => Carbon::now()->startOfDay(),
                    'week' => Carbon::now()->subDays(7)->startOfDay(),
                    default => Carbon::now()->subDays(30)->startOfDay(),
                };

                // KPI GLOBALES
                $totalFiles = Recording::count();
                $totalSize = Recording::sum('size');
                $activeUsers = User::where('is_active', true)->count();
                
                $downloadsToday = AuditLog::whereDate('created_at', Carbon::today())
                    ->whereIn('action', ['Descarga', 'Descarga ZIP', 'Descarga ZIP Folder'])
                    ->count();

                // BANDEJA DE ENTRADA
                $importLocationsIds = StorageLocation::where('name', 'like', '%Importaci%')->pluck('id');
                $importFilesCount = Recording::whereIn('storage_location_id', $importLocationsIds)
                                             ->orWhereNull('storage_location_id')
                                             ->count();

                // 3. DEMANDA (Barras - Regla estricta para Importaciones)
                $demandStats = [];
                
                // OPTIMIZACIÓN: Solo traemos nombres de campañas puras, ignoramos importaciones desde la raíz
                $motherFolders = StorageLocation::where('name', 'not like', '%Importaci%')->pluck('name')->toArray();

                AuditLog::select('action', 'details', 'metadata')
                    ->whereIn('action', ['Descarga', 'Descarga ZIP', 'Descarga ZIP Folder'])
                    ->where('created_at', '>=', $startDate)
                    ->chunk(2000, function ($logs) use (&$demandStats, $motherFolders) {
                        
                        foreach ($logs as $log) {
                            $found = false;
                            
                            // LECTURA JSON
                            if (!empty($log->metadata)) {
                                $meta = is_string($log->metadata) ? json_decode($log->metadata, true) : $log->metadata;
                                if (is_array($meta)) {
                                    
                                    if (isset($meta['campaigns_breakdown']) || isset($meta['campaigns'])) {
                                        $breakdown = $meta['campaigns_breakdown'] ?? $meta['campaigns'];
                                        foreach ($breakdown as $name => $count) {
                                            $cleanName = $name ?: 'Otros / Sin clasificar';
                                            
                                            // REGLA CLAVE: Si dice "Importación" o "General", va a Otros
                                            if (stripos($cleanName, 'importaci') !== false || $cleanName === 'General') {
                                                $cleanName = 'Otros / Sin clasificar';
                                            }
                                            
                                            if (!isset($demandStats[$cleanName])) $demandStats[$cleanName] = 0;
                                            $demandStats[$cleanName] += (int)$count;
                                            $found = true;
                                        }
                                    } 
                                    elseif (isset($meta['campaign'])) {
                                        $cleanName = $meta['campaign'] ?: 'Otros / Sin clasificar';
                                        
                                        // REGLA CLAVE
                                        if (stripos($cleanName, 'importaci') !== false || $cleanName === 'General') {
                                            $cleanName = 'Otros / Sin clasificar';
                                        }
                                        
                                        if (!isset($demandStats[$cleanName])) $demandStats[$cleanName] = 0;
                                        
                                        $archivosSumados = isset($meta['file_count']) ? (int)$meta['file_count'] : 1;
                                        $demandStats[$cleanName] += $archivosSumados; 
                                        $found = true;
                                    }
                                }
                            }

                            // FALLBACK (Para logs viejos)
                            if (!$found && !empty($log->details)) {
                                foreach ($motherFolders as $folderName) {
                                    // Como $motherFolders ya no tiene importaciones, nunca hará match con ellas
                                    if (stripos($log->details, $folderName) !== false) {
                                        if (!isset($demandStats[$folderName])) $demandStats[$folderName] = 0;
                                        $demandStats[$folderName]++;
                                        $found = true;
                                        break;
                                    }
                                }
                                if (!$found) {
                                    $otherName = 'Otros / Sin clasificar';
                                    if (!isset($demandStats[$otherName])) $demandStats[$otherName] = 0;
                                    $demandStats[$otherName]++;
                                }
                            }
                        }
                    });

                arsort($demandStats);
                $topDemand = array_slice($demandStats, 0, 10);
                
                // DISTRIBUCIÓN (Dona) 
                $inventory = StorageLocation::where('is_active', true)
                    ->where('name', 'not like', '%Importaci%')
                    ->withCount('recordings')
                    ->having('recordings_count', '>', 0)
                    ->orderByDesc('recordings_count')
                    ->limit(6) 
                    ->get();

                return [
                    'kpi' => [
                        'files' => (int) $totalFiles,
                        'size' => $this->formatBytes($totalSize),
                        'users' => (int) $activeUsers,
                        'downloads_today' => (int) $downloadsToday,
                        'import_files' => (int) $importFilesCount
                    ],
                    'charts' => [
                        'campaigns' => [ 
                            'labels' => array_keys($topDemand), 
                            'data' => array_values($topDemand) 
                        ],
                        'distribution' => [ 
                            'labels' => $inventory->pluck('name'), 
                            'data' => $inventory->pluck('recordings_count') 
                        ]
                    ]
                ];
            });

            $stats['activity'] = $recentActivity;
            return response()->json($stats);

        } catch (\Exception $e) {
            Log::error("Error en Dashboard: " . $e->getMessage());
            return response()->json(['error' => 'Error interno procesando las estadísticas'], 500);
        }
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