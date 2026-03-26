<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use App\Models\StorageLocation;
use App\Models\AuditLog;

class IndexRecordings extends Command
{
    protected $signature   = 'telecom:index {path} {--job_id=terminal}';
    protected $description = 'Indexador nivel BIG DATA — Batch Insert + Streaming Puro (Cero RAM).';

    public function handle()
    {
        $inputPath = $this->argument('path');
        $jobId     = $this->option('job_id');
        $rootPath  = rtrim(str_replace('\\', '/', $inputPath), '/');

        if (!is_dir($rootPath)) {
            $this->error("Error: La ruta '$rootPath' no existe.");
            return Command::FAILURE;
        }

        // 1. ESTADO INICIAL
        Cache::put("progress_{$jobId}", [
            'status'     => 'starting',
            'percentage' => 0,
        ], 86400);

        // 2. CONTEO DE ARCHIVOS
        $this->info("Contando archivos con motor nativo de Linux...");
        $countCmd   = "timeout 3600 find " . escapeshellarg($rootPath)
                    . " -type f -iregex '.*\.\(mp3\|wav\|ogg\|aac\|wma\)$' 2>/dev/null | wc -l";
        $totalFiles = (int) shell_exec($countCmd);

        if ($totalFiles === 0) {
            Cache::put("progress_{$jobId}", [
                'status'     => 'completed',
                'percentage' => 100,
                'nuevos'     => 0,
                'omitidos'   => 0,
            ], 86400);

            $this->logAudit(null, 'Indexación Completada',
                "Ruta: {$rootPath} — Nuevos: 0 | Omitidos: 0 | Sin archivos de audio encontrados.");

            return Command::SUCCESS;
        }

        $processed = 0;
        $nuevos    = 0;
        $omitidos  = 0;
        $batch     = [];

        try {
            // 3. CREAR O RECUPERAR LA RUTA PADRE
            $location = StorageLocation::where('path', $rootPath)
                ->orWhere('path', $rootPath . '/')
                ->first();

            if (!$location) {
                $baseName = basename($rootPath);
                $name     = $baseName;
                $counter  = 1;
                while (StorageLocation::where('name', $name)->exists()) {
                    $name = $baseName . '_' . $counter;
                    $counter++;
                }
                $location = StorageLocation::create([
                    'path'      => $rootPath,
                    'name'      => $name,
                    'type'      => 'inbox',
                    'is_active' => true,
                ]);
            }

            $rootLocationId = $location->id;

            // 4. ✅ CARGA OPTIMIZADA — Solo paths de ESA carpeta, no de toda la BD
            $this->info("Cargando índice de duplicados solo para esta carpeta...");
            $existingPaths = [];

            DB::table('recordings')
                ->select('full_path')
                ->where('full_path', 'like', $rootPath . '%')
                ->orderBy('id')
                ->chunk(10000, function ($records) use (&$existingPaths) {
                    foreach ($records as $record) {
                        $existingPaths[$record->full_path] = true;
                    }
                });

            $this->info("Índice cargado: " . count($existingPaths) . " paths existentes en esta carpeta.");

            // 5. STREAMING PURO CON BATCH INSERT
            $findCmd = "timeout 7200 find " . escapeshellarg($rootPath)
                     . " -type f -iregex '.*\.\(mp3\|wav\|ogg\|aac\|wma\)$' 2>/dev/null";
            $handle  = popen($findCmd, 'r');

            if ($handle) {
                while (($line = fgets($handle)) !== false) {
                    $fullPath = trim($line);
                    if (empty($fullPath)) continue;

                    if (isset($existingPaths[$fullPath])) {
                        $omitidos++;
                    } else {
                        $batch[] = [
                            'filename'            => basename($fullPath),
                            'full_path'           => $fullPath,
                            'folder_path'         => rtrim(dirname($fullPath), '/'),
                            'size'                => @filesize($fullPath) ?: 0,
                            'extension'           => strtolower(pathinfo($fullPath, PATHINFO_EXTENSION)),
                            'storage_location_id' => $rootLocationId,
                            'fecha_grabacion'     => now(),
                        ];
                        $nuevos++;
                    }

                    $processed++;

                    if (count($batch) >= 500) {
                        DB::table('recordings')->insertOrIgnore($batch);
                        $batch = [];
                    }

                    if ($processed % 500 === 0 || $processed === $totalFiles) {
                        Cache::put("progress_{$jobId}", [
                            'status'     => 'processing',
                            'percentage' => round(($processed / $totalFiles) * 100),
                            'procesados' => $processed,
                            'total'      => $totalFiles,
                        ], 86400);
                    }
                }

                pclose($handle);
            }

            if (!empty($batch)) {
                DB::table('recordings')->insertOrIgnore($batch);
            }

            // 6. ÉXITO FINAL
            Cache::put("progress_{$jobId}", [
                'status'     => 'completed',
                'percentage' => 100,
                'nuevos'     => $nuevos,
                'omitidos'   => $omitidos,
            ], 86400);

            $this->logAudit(null, 'Indexación Completada',
                "Ruta: {$rootPath} — Nuevos: " . number_format($nuevos, 0, ',', '.') .
                " | Omitidos: " . number_format($omitidos, 0, ',', '.'));

            return Command::SUCCESS;

        } catch (\Exception $e) {
            if (!empty($batch)) {
                try { DB::table('recordings')->insertOrIgnore($batch); } catch (\Exception $ignored) {}
            }

            Cache::put("progress_{$jobId}", [
                'status'     => 'error',
                'percentage' => $totalFiles > 0 ? round(($processed / $totalFiles) * 100) : 0,
                'nuevos'     => $nuevos,
                'omitidos'   => $omitidos,
                'message'    => $e->getMessage(),
            ], 86400);

            $this->logAudit(null, 'Indexación Completada',
                "Ruta: {$rootPath} — Error: " . $e->getMessage() .
                " | Procesados hasta el fallo: " . number_format($processed, 0, ',', '.'));

            $this->error("Fallo general: " . $e->getMessage());
            return Command::FAILURE;
        }
    }

    private function logAudit($userId, $action, $details)
    {
        try {
            AuditLog::create([
                'user_id'    => $userId,
                'action'     => $action,
                'details'    => $details,
                'ip_address' => 'Sistema',
            ]);
        } catch (\Exception $e) {}
    }
}
