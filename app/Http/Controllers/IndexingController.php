<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Recording;
use App\Models\StorageLocation;
use App\Models\AuditLog;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class IndexingController extends Controller
{
    // --- NORMALIZACIÓN DE RUTAS (Mejorado y más seguro) ---
    private function normalizePath($inputPath)
    {
        $path = trim($inputPath, " \t\n\r\0\x0B\"'");
        $path = str_replace('\\', '/', $path);
        $path = rtrim($path, '/');
        if (file_exists($path)) {
            $realPath = realpath($path);
            if ($realPath) {
                return str_replace('\\', '/', $realPath);
            }
        }
        return $path;
    }

    // --- 1. ESCANEAR (Preview) ---
    public function scanFolder(Request $request)
    {
        try {
            $path = $this->normalizePath($request->input('path'));

            if (!is_dir($path)) {
                return response()->json(['message' => "La carpeta no existe o no es accesible."], 404);
            }

            $fileCount = 0;
            $totalSize = 0;

            $dirIterator = new RecursiveDirectoryIterator($path, RecursiveDirectoryIterator::SKIP_DOTS);
            $iterator = new RecursiveIteratorIterator($dirIterator, RecursiveIteratorIterator::LEAVES_ONLY);

            foreach ($iterator as $file) {
                if ($file->isFile() && preg_match('/\.(mp3|wav|ogg|aac|wma)$/i', $file->getFilename())) {
                    $fileCount++;
                    $totalSize += $file->getSize();
                }
            }

            $sizeMB = round($totalSize / 1024 / 1024, 2);

            return response()->json([
                'files_count' => $fileCount,
                'size_mb' => $sizeMB,
                'message' => "Escaneo completado. Se encontraron {$fileCount} archivos."
            ]);

        } catch (\Throwable $e) {
            Log::error("Error Scan: " . $e->getMessage());
            return response()->json(['message' => 'Error: ' . $e->getMessage()], 500);
        }
    }

    // --- 2. EJECUTAR INDEXACIÓN (NIVEL PRODUCCIÓN: Bulk Inserts) ---
    public function runIndexing(Request $request)
    {
        @set_time_limit(0);
        ini_set('memory_limit', '512M');

        try {
            $rootPath = $this->normalizePath($request->input('path'));
            $options = $request->input('options');

            if (!is_dir($rootPath)) {
                return response()->json(['message' => 'La carpeta no existe físicamente.'], 404);
            }

            // A. PREPARAR DESTINOS
            $campaigns = StorageLocation::where('is_active', true)
                ->where('type', 'campaign')
                ->pluck('id', 'name')
                ->mapWithKeys(fn($id, $name) => [strtolower($name) => $id])
                ->toArray();

            // 1. EL ESCUDO INDESTRUCTIBLE
            $cleanPath = rtrim($rootPath, '/');

            $existingLocation = StorageLocation::withoutGlobalScopes()
                ->where('path', $cleanPath)
                ->orWhere('path', $cleanPath . '/')
                ->first();

            if ($existingLocation) {
                if (method_exists($existingLocation, 'trashed') && $existingLocation->trashed()) {
                    $existingLocation->restore();
                }
                $targetLocationIdForInbox = $existingLocation->id;
            } else {
                try {
                    $newInbox = StorageLocation::create([
                        'path' => $rootPath,
                        'type' => 'inbox',
                        'name' => 'Importación ' . date('Y-m-d H:i'),
                        'is_active' => true
                    ]);
                    $targetLocationIdForInbox = $newInbox->id;
                } catch (QueryException $e) {
                    if ($e->errorInfo[1] == 1062) {
                        $fallback = StorageLocation::withoutGlobalScopes()
                            ->where('path', $cleanPath)
                            ->orWhere('path', $cleanPath . '/')
                            ->first();
                        $targetLocationIdForInbox = $fallback->id;
                    } else {
                        throw $e;
                    }
                }
            }

            // B. PROCESAMIENTO MASIVO
            $processedCount = 0;
            $skippedCount = 0;
            $autoClassifiedCount = 0;

            $dirIterator = new RecursiveDirectoryIterator($rootPath, RecursiveDirectoryIterator::SKIP_DOTS);
            $iterator = new RecursiveIteratorIterator($dirIterator, RecursiveIteratorIterator::LEAVES_ONLY);

            $chunk = [];
            $chunkSize = 1000;
            $now = Carbon::now()->toDateTimeString();

            foreach ($iterator as $file) {
                if ($file->isFile() && preg_match('/\.(mp3|wav|ogg|aac|wma)$/i', $file->getFilename())) {

                    $filename = $file->getFilename();
                    $fullPath = $this->normalizePath($file->getPathname());

                    // --- NUEVO: VALIDADOR BILINGÜE PARA WINDOWS Y LINUX ---
                    if ($options['skipDuplicates'] ?? true) {
                        $windowsPath = str_replace('/', '\\', $fullPath);

                        if (Recording::where('full_path', $fullPath)->orWhere('full_path', $windowsPath)->exists()) {
                            $skippedCount++; 
                            continue;
                        }
                    }

                    // C. LÓGICA DE AUTO-CLASIFICACIÓN
                    $targetLocationId = $targetLocationIdForInbox;
                    $detectedCampaignName = null;

                    foreach ($campaigns as $campName => $campId) {
                        if (str_contains(strtolower($filename), $campName)) {
                            $targetLocationId = $campId;
                            $detectedCampaignName = ucfirst($campName);
                            $autoClassifiedCount++;
                            break;
                        }
                    }

                    $meta = $this->extractMetadata($filename);
                    if ($detectedCampaignName) {
                        $meta['campana'] = $detectedCampaignName;
                    }

                    $fileDate = $meta['fecha']
                        ? $meta['fecha']->toDateTimeString()
                        : Carbon::createFromTimestamp($file->getMTime())->toDateTimeString();

                    $chunk[] = [
                        'storage_location_id' => $targetLocationId,
                        'filename' => $filename,
                        'full_path' => $fullPath,
                        'folder_path' => trim(str_replace($rootPath, '', $this->normalizePath($file->getPath())), '/'),
                        'size' => $file->getSize(),
                        'extension' => $file->getExtension(),
                        'cedula' => $meta['cedula'],
                        'telefono' => $meta['telefono'],
                        'campana' => $meta['campana'],
                        'fecha_grabacion' => $fileDate,
                        'original_created_at' => Carbon::createFromTimestamp($file->getMTime())->toDateTimeString(),
                        'duration' => 0,
                        'created_at' => $now,
                        'updated_at' => $now
                    ];

                    // D. EJECUTAR INSERCIÓN MASIVA
                    if (count($chunk) >= $chunkSize) {
                        $insertedThisChunk = Recording::insertOrIgnore($chunk);
                        $processedCount += $insertedThisChunk;
                        $skippedCount += (count($chunk) - $insertedThisChunk);
                        $chunk = [];
                    }
                }
            }

            // E. INSERTAR EL REMANENTE
            if (!empty($chunk)) {
                $insertedThisChunk = Recording::insertOrIgnore($chunk);
                $processedCount += $insertedThisChunk;
                $skippedCount += (count($chunk) - $insertedThisChunk);
            }

            // F. AUDITORÍA Y RESPUESTA
            $autoClassifiedCount = min($autoClassifiedCount, $processedCount);
            $this->logAudit($processedCount, $autoClassifiedCount, $rootPath);

            return response()->json([
                'indexed' => $processedCount,
                'auto_classified' => $autoClassifiedCount,
                'inbox_count' => $processedCount - $autoClassifiedCount,
                'skipped' => $skippedCount,
                'status_type' => $processedCount > 0 ? 'success' : 'warning',
                'title_msg' => $processedCount > 0 ? 'Éxito' : 'Sin cambios',
                'message' => $processedCount > 0
                    ? "Se indexaron $processedCount archivos nuevos ($skippedCount existentes omitidos)."
                    : "No se encontraron archivos nuevos en esta ruta ($skippedCount archivos ya estaban indexados)."
            ], 200);

        } catch (\Throwable $e) {
            Log::error("Error Crítico Indexing: " . $e->getMessage() . " en la línea " . $e->getLine());
            return response()->json(['message' => 'Error crítico: Verifica los logs del servidor.'], 500);
        }
    }


    // --- HELPERS PRIVADOS ---

    private function logAudit($count, $auto, $path) {
        try {
            AuditLog::create([
                'user_id' => Auth::id(),
                'action' => 'Indexación',
                'details' => "Ruta: $path. Indexados: $count. Auto-clasificados: $auto.",
                'ip_address' => request()->ip(),
                'metadata' => json_encode(['path' => $path, 'total' => $count, 'auto' => $auto])
            ]);
        } catch (\Exception $e) {}
    }

    private function extractMetadata($filename)
    {
        $data = ['cedula' => null, 'telefono' => null, 'campana' => null, 'fecha' => null];

        $cleanName = preg_replace('/[^a-zA-Z0-9]/', ' ', $filename);

        preg_match_all('/\d+/', $cleanName, $matches);
        $numeros = $matches[0] ?? [];

        foreach ($numeros as $num) {
            $len = strlen($num);

            if ($len >= 7 && $len <= 10) {
                if ($len == 10 && str_starts_with($num, '3')) {
                    if (!$data['telefono']) $data['telefono'] = $num;
                } else {
                    if (!$data['cedula']) $data['cedula'] = $num;
                }
            }
            elseif ($len == 10 && str_starts_with($num, '3')) {
                if (!$data['telefono']) $data['telefono'] = $num;
            }
            elseif ($len == 8 && str_starts_with($num, '202')) {
                try {
                    $data['fecha'] = Carbon::createFromFormat('Ymd', $num);
                } catch (\Exception $e) {}
            }
        }

        return $data;
    }
}
