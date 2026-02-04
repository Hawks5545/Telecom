<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Recording;
use App\Models\StorageLocation;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use Illuminate\Database\QueryException; 

class IndexingController extends Controller
{
    private function normalizePath($inputPath)
    {
        // 1. Quitar comillas y espacios extremos
        $path = trim($inputPath, " \t\n\r\0\x0B\"'");
        
        // 2. Unificar separadores a barra normal (/)
        $path = str_replace('\\', '/', $path);

        // 3. Quitar barra final si existe (para evitar duplicados por "carpeta/" vs "carpeta")
        $path = rtrim($path, '/');

        // 4. Resolver rutas relativas si no tienen dos puntos (C:) o barra inicial (/)
        if (!str_contains($path, ':') && !str_starts_with($path, '/')) {
            return public_path($path); // Ojo con esto si usas rutas absolutas de Windows
        }
        return $path;
    }

    public function scanFolder(Request $request)
    {
        try {
            $path = $this->normalizePath($request->input('path'));

            if (!is_dir($path)) {
                return response()->json(['message' => "La carpeta no existe o no es accesible: {$path}"], 404);
            }

            $fileCount = 0;
            $totalSize = 0;

            $dirIterator = new RecursiveDirectoryIterator($path, RecursiveDirectoryIterator::SKIP_DOTS);
            $iterator = new RecursiveIteratorIterator($dirIterator, RecursiveIteratorIterator::LEAVES_ONLY);

            foreach ($iterator as $file) {
                if ($file->isFile() && in_array(strtolower($file->getExtension()), ['mp3', 'wav', 'ogg', 'aac', 'wma'])) {
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

    public function runIndexing(Request $request)
    {
        @set_time_limit(0); 

        try {
            $rootPath = $this->normalizePath($request->input('path'));
            $options = $request->input('options');

            if (!is_dir($rootPath)) {
                return response()->json(['message' => 'La carpeta no existe físicamente.'], 404);
            }

            // --- 1. GESTIÓN SEGURA DE LA UBICACIÓN (CARPETA) ---
            
            // Intentamos buscarla exactamente como la normalizamos
            $location = StorageLocation::where('path', $rootPath)->first();

            // Si no la encontramos, intentamos buscarla con/sin barra final por si acaso
            if (!$location) {
                $location = StorageLocation::where('path', $rootPath . '/')->first();
            }

            // Si definitivamente no existe en memoria, intentamos crearla
            if (!$location) {
                try {
                    $location = StorageLocation::create([
                        'path' => $rootPath,
                        'name' => 'Importación ' . date('Y-m-d H:i'),
                        'is_active' => true
                    ]);
                } catch (QueryException $e) {
                    // Error 1062 = Duplicate entry. Significa que YA EXISTE en BD pero no la encontramos antes (quizás por mayúsculas/minúsculas o barras invertidas guardadas)
                    if ($e->errorInfo[1] == 1062) {
                        // Plan B: Buscarla relajando la coincidencia (si la BD lo permite) o asumiendo que es la ruta exacta
                        $location = StorageLocation::where('path', $rootPath)->first();
                        
                        // Si aun así es null (muy raro), intentamos buscarla reemplazando barras inversas por si en BD está guardada "mal"
                        if (!$location) {
                            $pathWindows = str_replace('/', '\\', $rootPath);
                            $location = StorageLocation::where('path', $pathWindows)->first();
                        }
                    } else {
                        throw $e; // Si es otro error, lo lanzamos
                    }
                }
            }

            // --- PROTECCIÓN CRÍTICA ---
            if (!$location) {
                return response()->json([
                    'message' => 'Error crítico: La ubicación existe en base de datos pero el sistema no pudo recuperar su ID. Esto suele pasar por diferencias en las barras (/) o mayúsculas.',
                    'debug_path' => $rootPath
                ], 500);
            }

            $processedCount = 0;
            $skippedCount = 0;

            $dirIterator = new RecursiveDirectoryIterator($rootPath, RecursiveDirectoryIterator::SKIP_DOTS);
            $iterator = new RecursiveIteratorIterator($dirIterator, RecursiveIteratorIterator::LEAVES_ONLY);

            foreach ($iterator as $file) {
                if ($file->isFile() && in_array(strtolower($file->getExtension()), ['mp3', 'wav', 'ogg', 'aac', 'wma'])) {
                    
                    $filename = $file->getFilename();
                    // Normalizamos full path para evitar duplicados por barras
                    $fullPath = $this->normalizePath($file->getPathname());

                    $parentDir = $this->normalizePath($file->getPath());
                    $relativePath = str_replace($rootPath, '', $parentDir);
                    $relativePath = trim($relativePath, '/');

                    $fileTimestamp = $file->getMTime(); 
                    $originalDate = Carbon::createFromTimestamp($fileTimestamp);

                    // Filtro rápido por PHP para saltar duplicados
                    if ($options['skipDuplicates'] ?? true) {
                        // Buscamos normalizando también la consulta
                        if (Recording::where('full_path', $fullPath)->exists()) {
                            $skippedCount++;
                            continue;
                        }
                    }

                    $meta = $this->extractMetadata($filename);

                    // --- 2. INSERCIÓN SEGURA DEL ARCHIVO ---
                    try {
                        Recording::create([
                            'storage_location_id' => $location->id, // AQUI YA NO FALLARÁ PORQUE $location ESTÁ VALIDADO
                            'filename' => $filename,
                            'path' => $fullPath, 
                            'full_path' => $fullPath,
                            'folder_path' => $relativePath,
                            'size' => $file->getSize(),
                            'extension' => $file->getExtension(),
                            'cedula' => $meta['cedula'],
                            'telefono' => $meta['telefono'],
                            'campana' => $meta['campana'],
                            'fecha_grabacion' => $meta['fecha'] ?? $originalDate,
                            'original_created_at' => $originalDate,
                            'duration' => 0
                        ]);
                        $processedCount++;

                    } catch (QueryException $e) {
                        if ($e->errorInfo[1] == 1062) {
                            $skippedCount++;
                        } else {
                            Log::warning("Error insertando $filename: " . $e->getMessage());
                        }
                    }
                }
            }

            // --- 3. RESPUESTA INTELIGENTE ---
            $statusType = 'success';
            $titleMsg = 'Indexación Exitosa';
            $message = "Se indexaron {$processedCount} archivos nuevos correctamente.";

            if ($processedCount === 0 && $skippedCount > 0) {
                $statusType = 'warning';
                $titleMsg = 'Sin Cambios';
                $message = "La carpeta ya estaba indexada. No se encontraron archivos nuevos.";
            } elseif ($processedCount > 0 && $skippedCount > 0) {
                $statusType = 'info';
                $titleMsg = 'Indexación Parcial';
                $message = "Se agregaron {$processedCount} archivos nuevos. {$skippedCount} ya existían.";
            }

            return response()->json([
                'indexed' => $processedCount,
                'skipped' => $skippedCount,
                'total_in_db' => Recording::count(),
                'status_type' => $statusType, 
                'title_msg' => $titleMsg,
                'message' => $message
            ]);

        } catch (\Throwable $e) {
            Log::error("Error Indexing: " . $e->getMessage());
            return response()->json(['message' => 'Error crítico: ' . $e->getMessage()], 500);
        }
    }

    private function extractMetadata($filename)
    {
        $data = ['cedula' => null, 'telefono' => null, 'campana' => null, 'fecha' => null];
        
        $cleanName = preg_replace('/(\d+)([a-zA-Z]+)/', '$1 $2', $filename);
        $cleanName = preg_replace('/([a-zA-Z]+)(\d+)/', '$1 $2', $cleanName);
        $cleanName = str_replace(['_', '-', '.'], ' ', $cleanName);

        $keywords = ['Ventas', 'Soporte', 'Cobranzas', 'Claro', 'Movistar', 'ETB', 'WOM', 'Tigo', 'Retencion'];
        foreach ($keywords as $key) {
            if (stripos($cleanName, $key) !== false) {
                $data['campana'] = $key;
                break;
            }
        }

        preg_match_all('/\d+/', $cleanName, $matches);
        $numerosEncontrados = $matches[0] ?? [];

        foreach ($numerosEncontrados as $num) {
            $len = strlen($num);

            // A. FECHA (Prioridad: Ymd, empieza con 202)
            if (($len == 8) && str_starts_with($num, '202')) { 
                try { $data['fecha'] = Carbon::createFromFormat('Ymd', $num); continue; } catch (\Exception $e) {}
            }

            // B. CELULAR (Prioridad: 10 dígitos y empieza por 3)
            if ($len == 10 && str_starts_with($num, '3')) {
                if (!$data['telefono']) {
                    $data['telefono'] = $num;
                    continue; 
                }
            }

            // C. CÉDULA (7 a 10 dígitos)
            if ($len >= 7 && $len <= 10) {
                if ($len == 10 && str_starts_with($num, '3')) {
                    continue; 
                }
                if (!$data['cedula']) {
                    $data['cedula'] = $num;
                }
            }
        }
        return $data;
    }
}