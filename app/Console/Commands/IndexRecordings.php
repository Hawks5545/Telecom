<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use App\Models\Recording;
use App\Models\StorageLocation;

class IndexRecordings extends Command
{
    protected $signature = 'telecom:index {path} {--job_id=terminal}';
    protected $description = 'Indexador nivel BIG DATA (Streaming Puro - Cero RAM).';

    public function handle()
    {
        $inputPath = $this->argument('path');
        $jobId = $this->option('job_id');

        $rootPath = rtrim(str_replace('\\', '/', $inputPath), '/');

        if (!is_dir($rootPath)) {
            $this->error("Error: La ruta '$rootPath' no existe.");
            return Command::FAILURE;
        }

        // 1. CONTEO ULTRA RÁPIDO CON LINUX
        $this->info("Contando millones de archivos con motor nativo de Linux...");
        $countCmd = "find " . escapeshellarg($rootPath) . " -type f -iregex '.*\.\(mp3\|wav\|ogg\|aac\|wma\)$' | wc -l";
        $totalFiles = (int) shell_exec($countCmd);

        if ($totalFiles === 0) {
            Cache::put("progress_{$jobId}", ['status' => 'completed', 'percentage' => 100, 'nuevos' => 0, 'omitidos' => 0], 120);
            return Command::SUCCESS;
        }

        $processed = 0; $nuevos = 0; $omitidos = 0;

        try {
            // 2. CREAR LA ÚNICA RUTA PADRE
            $location = StorageLocation::where('path', $rootPath)->orWhere('path', $rootPath . '/')->first();
            if (!$location) {
                $baseName = basename($rootPath);
                $name = $baseName;
                $counter = 1;
                while (StorageLocation::where('name', $name)->exists()) {
                    $name = $baseName . '_' . $counter;
                    $counter++;
                }
                $location = StorageLocation::create([
                    'path' => $rootPath, 'name' => $name, 'type' => 'inbox', 'is_active' => true
                ]);
            }
            $rootLocationId = $location->id;

            // 3. GENERADOR EN STREAMING PURO (Cero impacto en RAM)
            $findCmd = "find " . escapeshellarg($rootPath) . " -type f -iregex '.*\.\(mp3\|wav\|ogg\|aac\|wma\)$'";
            $handle = popen($findCmd, 'r');

            if ($handle) {
                while (($line = fgets($handle)) !== false) {
                    $fullPath = trim($line);
                    if (empty($fullPath)) continue;

                    $filename = basename($fullPath);
                    $actualFolderPath = rtrim(str_replace('\\', '/', dirname($fullPath)), '/');
                    $size = @filesize($fullPath) ?: 0;

                    // 4. PROCESAMIENTO
                    if (Recording::where('full_path', $fullPath)->exists()) {
                        $omitidos++;
                    } else {
                        Recording::create([
                            'filename' => $filename, 
                            'full_path' => $fullPath,
                            'folder_path' => $actualFolderPath, 
                            'size' => $size,
                            'storage_location_id' => $rootLocationId,
                            'fecha_grabacion' => now()
                        ]);
                        $nuevos++;
                    }

                    $processed++;
                    
                    // Actualizamos a React cada 500 audios para no saturar
                    if ($processed % 500 === 0 || $processed === $totalFiles) {
                        Cache::put("progress_{$jobId}", [
                            'status' => 'processing',
                            'percentage' => round(($processed / $totalFiles) * 100)
                        ], 120);
                    }
                }
                pclose($handle);
            }

            // ÉXITO FINAL
            Cache::put("progress_{$jobId}", [
                'status' => 'completed', 'percentage' => 100, 'nuevos' => $nuevos, 'omitidos' => $omitidos
            ], 120);
            return Command::SUCCESS;

        } catch (\Exception $e) {
            Cache::put("progress_{$jobId}", ['status' => 'completed', 'percentage' => 100, 'nuevos' => $nuevos, 'omitidos' => $omitidos], 120);
            $this->error("Fallo general: " . $e->getMessage());
            return Command::FAILURE;
        }
    }
}
