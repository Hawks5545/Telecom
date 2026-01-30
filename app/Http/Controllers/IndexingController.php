<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Recording;
use App\Models\StorageLocation;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class IndexingController extends Controller
{
    
    private function normalizePath($inputPath)
    {
        $path = trim($inputPath);
        $path = str_replace(['"', "'"], '', $path);
        $path = str_replace('\\', '/', $path);

        // Si la ruta NO contiene "C:/" o "/" al inicio, asumimos que es relativa a public/
        if (!str_contains($path, ':') && !str_starts_with($path, '/')) {
            return public_path($path);
        }

        return $path;
    }

    public function scanFolder(Request $request)
    {
        try {
            // USA EL HELPER PARA ARREGLAR LA RUTA
            $path = $this->normalizePath($request->input('path'));

            if (!is_dir($path)) {
                return response()->json([
                    'message' => "La carpeta no existe o no es accesible: {$path}"
                ], 404);
            }

            $fileCount = 0;
            $totalSize = 0;

            // Escaneo seguro
            $dirIterator = new \RecursiveDirectoryIterator($path, \RecursiveDirectoryIterator::SKIP_DOTS);
            $iterator = new \RecursiveIteratorIterator($dirIterator, \RecursiveIteratorIterator::LEAVES_ONLY);

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
            // USAMOS EL HELPER AQUÍ TAMBIÉN
            $path = $this->normalizePath($request->input('path'));
            $options = $request->input('options');

            if (!is_dir($path)) {
                return response()->json(['message' => 'La carpeta no existe.'], 404);
            }

            // Guardamos la ruta absoluta real en la BD para que funcione el download después
            $location = StorageLocation::firstOrCreate(
                ['path' => $path],
                ['name' => 'Importación ' . date('Y-m-d H:i'), 'is_active' => true]
            );

            $processedCount = 0;
            $skippedCount = 0;

            $dirIterator = new \RecursiveDirectoryIterator($path, \RecursiveDirectoryIterator::SKIP_DOTS);
            $iterator = new \RecursiveIteratorIterator($dirIterator, \RecursiveIteratorIterator::LEAVES_ONLY);

            foreach ($iterator as $file) {
                if ($file->isFile() && in_array(strtolower($file->getExtension()), ['mp3', 'wav', 'ogg', 'aac', 'wma'])) {
                    
                    $filename = $file->getFilename();
                    $filePath = str_replace('\\', '/', $file->getPathname());

                    if ($options['skipDuplicates'] ?? true) {
                        if (Recording::where('path', $filePath)->exists()) {
                            $skippedCount++;
                            continue;
                        }
                    }

                    $meta = $this->extractMetadata($filename);

                    Recording::create([
                        'storage_location_id' => $location->id,
                        'filename' => $filename,
                        'path' => $filePath,
                        'size' => $file->getSize(),
                        'extension' => $file->getExtension(),
                        'cedula' => $meta['cedula'],
                        'telefono' => $meta['telefono'],
                        'campana' => $meta['campana'],
                        'fecha_grabacion' => $meta['fecha'] ?? Carbon::now(),
                        'duration' => 0
                    ]);

                    $processedCount++;
                }
            }

            return response()->json([
                'indexed' => $processedCount,
                'skipped' => $skippedCount,
                'total_in_db' => Recording::count()
            ]);

        } catch (\Throwable $e) {
            Log::error("Error Indexing: " . $e->getMessage());
            return response()->json(['message' => 'Error: ' . $e->getMessage()], 500);
        }
    }

    private function extractMetadata($filename)
    {
        $data = [
            'cedula' => null,
            'telefono' => null,
            'campana' => null,
            'fecha' => null
        ];

        // 1. Limpieza
        $cleanName = preg_replace('/(\d+)([a-zA-Z]+)/', '$1 $2', $filename);
        $cleanName = preg_replace('/([a-zA-Z]+)(\d+)/', '$1 $2', $cleanName);
        $cleanName = str_replace(['_', '-', '.'], ' ', $cleanName);

        // 2. Buscar Campaña
        $keywords = ['Ventas', 'Soporte', 'Cobranzas', 'Claro', 'Movistar', 'ETB', 'WOM', 'Tigo', 'Retencion'];
        foreach ($keywords as $key) {
            if (stripos($cleanName, $key) !== false) {
                $data['campana'] = $key;
                break;
            }
        }

        // 3. Analizar Números
        preg_match_all('/\d+/', $cleanName, $matches);
        $numerosEncontrados = $matches[0] ?? [];

        foreach ($numerosEncontrados as $num) {
            $len = strlen($num);

            // Fecha
            if (($len == 8) && str_starts_with($num, '202')) { 
                try {
                    $data['fecha'] = Carbon::createFromFormat('Ymd', $num);
                    continue;
                } catch (\Exception $e) {}
            }

            // Celular
            if ($len == 10 && str_starts_with($num, '3')) {
                if (!$data['telefono']) {
                    $data['telefono'] = $num;
                    continue; 
                }
            }

            // Cédula
            if ($len >= 7 && $len <= 10) {
                if ($len == 10 && str_starts_with($num, '3')) continue; 
                if (!$data['cedula']) $data['cedula'] = $num;
            }
        }

        return $data;
    }
}