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
        // Limpieza básica
        $path = trim($inputPath, " \t\n\r\0\x0B\"'");
        
        // Convertir todo a slash normal (/) para consistencia
        $path = str_replace('\\', '/', $path);

        // Eliminar slash final
        $path = rtrim($path, '/');

        // Seguridad: Resolver ruta real para evitar ".." (Path Traversal)
        // Solo si la carpeta existe físicamente
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

            // Iterador optimizado de PHP (muy rápido)
            $dirIterator = new RecursiveDirectoryIterator($path, RecursiveDirectoryIterator::SKIP_DOTS);
            $iterator = new RecursiveIteratorIterator($dirIterator, RecursiveIteratorIterator::LEAVES_ONLY);

            foreach ($iterator as $file) {
                // Filtro rápido de extensión
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

    // --- 2. EJECUTAR INDEXACIÓN (La Lógica Maestra) ---
    public function runIndexing(Request $request)
    {
        @set_time_limit(0); // Evitar timeout en cargas masivas

        try {
            $rootPath = $this->normalizePath($request->input('path'));
            $options = $request->input('options');

            if (!is_dir($rootPath)) {
                return response()->json(['message' => 'La carpeta no existe físicamente.'], 404);
            }

            // A. PREPARAR DESTINOS (OPTIMIZACIÓN)
            
            // 1. Cargamos Campañas "Madre" en memoria para comparación rápida
            // Esto evita hacer miles de consultas a la BD dentro del bucle.
            // Formato: ['claro' => 5, 'etb' => 8, 'movistar' => 2] (Nombre en minúscula => ID)
            $campaigns = StorageLocation::where('is_active', true)
                ->pluck('id', 'name')
                ->mapWithKeys(fn($id, $name) => [strtolower($name) => $id])
                ->toArray();

            // 2. Gestionar la "Bandeja de Entrada" (Importación Física)
            // Si el archivo no coincide con ninguna campaña, caerá aquí.
            $inboxLocation = StorageLocation::firstOrCreate(
                ['path' => $rootPath],
                [
                    'name' => 'Importación ' . date('Y-m-d H:i'),
                    'is_active' => true
                ]
            );

            // B. PROCESAMIENTO DE ARCHIVOS
            $processedCount = 0;
            $skippedCount = 0;
            $autoClassifiedCount = 0; // Contador para saber cuántos se movieron solos

            $dirIterator = new RecursiveDirectoryIterator($rootPath, RecursiveDirectoryIterator::SKIP_DOTS);
            $iterator = new RecursiveIteratorIterator($dirIterator, RecursiveIteratorIterator::LEAVES_ONLY);

            foreach ($iterator as $file) {
                // Validación rápida de extensión usando Regex (más rápido que in_array)
                if ($file->isFile() && preg_match('/\.(mp3|wav|ogg|aac|wma)$/i', $file->getFilename())) {
                    
                    $filename = $file->getFilename();
                    $fullPath = $this->normalizePath($file->getPathname());

                    // Verificar duplicados si la opción está activa
                    if ($options['skipDuplicates'] ?? true) {
                        if (Recording::where('full_path', $fullPath)->exists()) {
                            $skippedCount++;
                            continue;
                        }
                    }

                    // --- C. LÓGICA DE AUTO-CLASIFICACIÓN ---
                    $targetLocationId = $inboxLocation->id; // Por defecto: Bandeja de Entrada
                    $detectedCampaignName = null;

                    // Buscamos si el nombre del archivo contiene alguna campaña conocida
                    // Ej: "Audio_Claro_123.mp3" contiene "claro"
                    foreach ($campaigns as $campName => $campId) {
                        if (str_contains(strtolower($filename), $campName)) {
                            $targetLocationId = $campId; // ¡Bingo! Lo mandamos a la campaña
                            $detectedCampaignName = ucfirst($campName); // Guardamos el nombre bonito
                            $autoClassifiedCount++;
                            break; // Ya encontramos, dejamos de buscar
                        }
                    }

                    // Extracción de metadatos (Cédula, Teléfono, Fecha)
                    $meta = $this->extractMetadata($filename);

                    // Si detectamos campaña en el nombre, sobrescribimos la del metadata
                    if ($detectedCampaignName) {
                        $meta['campana'] = $detectedCampaignName;
                    }

                    // Guardar en BD
                    try {
                        Recording::create([
                            'storage_location_id' => $targetLocationId, // Aquí ocurre la magia
                            'filename' => $filename,
                            'full_path' => $fullPath,
                            'folder_path' => trim(str_replace($rootPath, '', $this->normalizePath($file->getPath())), '/'),
                            'size' => $file->getSize(),
                            'extension' => $file->getExtension(),
                            'cedula' => $meta['cedula'],
                            'telefono' => $meta['telefono'],
                            'campana' => $meta['campana'], // Nombre texto (ej: Claro)
                            'fecha_grabacion' => $meta['fecha'] ?? Carbon::createFromTimestamp($file->getMTime()),
                            'original_created_at' => Carbon::createFromTimestamp($file->getMTime()),
                            'duration' => 0
                        ]);
                        $processedCount++;

                    } catch (QueryException $e) {
                        // Error 1062 es Duplicate Entry (ya existe)
                        if ($e->errorInfo[1] == 1062) {
                            $skippedCount++;
                        } else {
                            Log::warning("Error insertando $filename: " . $e->getMessage());
                        }
                    }
                }
            }

            // D. AUDITORÍA Y RESPUESTA
            $this->logAudit($processedCount, $autoClassifiedCount, $rootPath);

            return response()->json([
                'indexed' => $processedCount,
                'auto_classified' => $autoClassifiedCount, // Dato útil para el frontend
                'inbox_count' => $processedCount - $autoClassifiedCount,
                'skipped' => $skippedCount,
                'status_type' => $processedCount > 0 ? 'success' : 'warning',
                'title_msg' => $processedCount > 0 ? 'Éxito' : 'Sin cambios',
                'message' => $processedCount > 0 
                    ? "Se indexaron $processedCount archivos ($autoClassifiedCount clasificados automáticamente)." 
                    : "No se encontraron archivos nuevos."
            ]);

        } catch (\Throwable $e) {
            Log::error("Error Crítico Indexing: " . $e->getMessage());
            return response()->json(['message' => 'Error crítico: ' . $e->getMessage()], 500);
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
        
        // Limpieza de nombre para facilitar regex
        $cleanName = preg_replace('/[^a-zA-Z0-9]/', ' ', $filename);

        // Búsqueda de secuencias numéricas
        preg_match_all('/\d+/', $cleanName, $matches);
        $numeros = $matches[0] ?? [];

        foreach ($numeros as $num) {
            $len = strlen($num);

            // Cédulas (7 a 10 dígitos, y que NO empiecen por 3 si son de 10)
            if ($len >= 7 && $len <= 10) {
                // Validación simple para distinguir celular de cédula en Colombia
                if ($len == 10 && str_starts_with($num, '3')) {
                    if (!$data['telefono']) $data['telefono'] = $num;
                } else {
                    if (!$data['cedula']) $data['cedula'] = $num;
                }
            }
            // Celulares explícitos (10 dígitos empieza por 3)
            elseif ($len == 10 && str_starts_with($num, '3')) {
                if (!$data['telefono']) $data['telefono'] = $num;
            }
            // Fechas Ymd (20250101)
            elseif ($len == 8 && str_starts_with($num, '202')) {
                try {
                    $data['fecha'] = Carbon::createFromFormat('Ymd', $num);
                } catch (\Exception $e) {}
            }
        }

        return $data;
    }
}