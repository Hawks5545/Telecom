<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Recording;
use App\Models\StorageLocation;
use Carbon\Carbon;
use Symfony\Component\Finder\Finder;

class IndexRecordingsCommand extends Command
{
    // El comando que se ejecuta en la terminal
    protected $signature = 'telecom:index {path : La ruta absoluta de la carpeta a indexar}';
    
    protected $description = 'Indexa masivamente grabaciones desde una ruta local ultra-optimizado para Big Data.';

    public function handle()
    {
        // 1. Configuración de Memoria y Tiempo "Inmortal"
        ini_set('memory_limit', '2048M'); 
        @set_time_limit(0);

        $path = rtrim($this->argument('path'), " \t\n\r\0\x0B\"'\\/");
        
        if (!is_dir($path)) {
            $this->error("La ruta no existe o no es un directorio válido: {$path}");
            return 1;
        }

        $this->info("===========================================");
        $this->info("🚀 INICIANDO INDEXACIÓN 10/10 EN: {$path}");
        $this->info("===========================================");

        // 2. Preparar Destinos (Campañas y Bandeja de Entrada)
        $campaigns = StorageLocation::where('is_active', true)
            ->where('type', 'campaign')
            ->pluck('id', 'name')
            ->mapWithKeys(fn($id, $name) => [strtolower($name) => $id])
            ->toArray();

        $existingLocation = StorageLocation::withoutGlobalScopes()
            ->where('path', $path)
            ->orWhere('path', $path . '/')
            ->first();

        if ($existingLocation) {
            if (method_exists($existingLocation, 'trashed') && $existingLocation->trashed()) {
                $existingLocation->restore();
            }
            $targetLocationIdForInbox = $existingLocation->id;
        } else {
            $newInbox = StorageLocation::create([
                'path' => $path,
                'type' => 'inbox',
                'name' => 'Importación Terminal ' . date('Y-m-d H:i'),
                'is_active' => true
            ]);
            $targetLocationIdForInbox = $newInbox->id;
        }

        // 3. Motor de Búsqueda a prueba de fallos
        $finder = new Finder();
        $finder->files()
               ->in($path)
               ->ignoreUnreadableDirs() // Se salta .cache y carpetas prohibidas
               ->name('/\.(mp3|wav|ogg|aac|wma)$/i');

        $chunk = [];
        $chunkSize = 1000;
        $now = Carbon::now()->toDateTimeString();

        $processedCount = 0;
        $skippedCount = 0;
        $autoClassifiedCount = 0;

        $this->line("\n⏳ Escaneando y procesando en lotes de 1000... (Sin colapsar MySQL)");

        foreach ($finder as $file) {
            $filename = $file->getFilename();
            $fullPath = str_replace('\\', '/', $file->getPathname());

            $targetLocationId = $targetLocationIdForInbox;
            $detectedCampaignName = null;

            // Auto-clasificador de campañas
            foreach ($campaigns as $campName => $campId) {
                if (str_contains(strtolower($filename), $campName)) {
                    $targetLocationId = $campId;
                    $detectedCampaignName = ucfirst($campName);
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

            // Metemos el archivo a la "caja"
            $chunk[] = [
                'storage_location_id' => $targetLocationId,
                'filename' => $filename,
		'path'=> $fullPath,
                'full_path' => $fullPath,
                'folder_path' => trim(str_replace($path, '', str_replace('\\', '/', $file->getPath())), '/'),
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

            // 4. Inserción Ultra-Optimizada cuando la caja se llena
            if (count($chunk) >= $chunkSize) {
                $results = $this->processChunk($chunk);
                $processedCount += $results['inserted'];
                $skippedCount += $results['skipped'];
                $autoClassifiedCount += $this->countAutoClassified($chunk, $targetLocationIdForInbox);
                
                $chunk = []; // Vaciar la caja
                $this->info("-> Lote procesado. Total guardados: {$processedCount} | Omitidos: {$skippedCount}");
            }
        }

        // Procesar los poquitos archivos que quedaron al final
        if (!empty($chunk)) {
            $results = $this->processChunk($chunk);
            $processedCount += $results['inserted'];
            $skippedCount += $results['skipped'];
            $autoClassifiedCount += $this->countAutoClassified($chunk, $targetLocationIdForInbox);
        }

        $this->info("\n===========================================");
        $this->info("✅ ¡INDEXACIÓN 10/10 COMPLETADA!");
        $this->info("===========================================");
        $this->line("Nuevos indexados: <fg=green;options=bold>{$processedCount}</>");
        $this->line("Auto-clasificados a campañas: <fg=cyan>{$autoClassifiedCount}</>");
        $this->line("Omitidos (Duplicados): <fg=yellow>{$skippedCount}</>");
        $this->info("===========================================\n");

        return 0;
    }

    /**
     * MAGIA: Filtra los duplicados con UNA SOLA consulta a BD
     */
    private function processChunk(array $chunk)
    {
        // 1. Extraemos todas las rutas de los 1000 archivos
        $pathsInChunk = array_column($chunk, 'full_path');

        // 2. Le preguntamos a MySQL cuáles ya existen en un solo viaje
        $existingPaths = Recording::whereIn('full_path', $pathsInChunk)
            ->pluck('full_path')
            ->flip() // Búsqueda instantánea en memoria
            ->toArray();

        $toInsert = [];
        $skippedCount = 0;

        foreach ($chunk as $item) {
            // Si la ruta ya estaba en la BD, se omite
            if (isset($existingPaths[$item['full_path']])) {
                $skippedCount++;
            } else {
                $toInsert[] = $item;
                // Lo registramos en memoria por si hay un repetido dentro del mismo lote
                $existingPaths[$item['full_path']] = true; 
            }
        }

        // 3. Insertamos de golpe solo los nuevos
        if (!empty($toInsert)) {
            Recording::insert($toInsert);
        }

        return [
            'inserted' => count($toInsert),
            'skipped' => $skippedCount
        ];
    }

    private function countAutoClassified($chunk, $inboxId)
    {
        $count = 0;
        foreach ($chunk as $item) {
            if ($item['storage_location_id'] !== $inboxId) {
                $count++;
            }
        }
        return $count;
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
