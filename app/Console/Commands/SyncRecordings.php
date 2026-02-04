<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Recording;
use App\Models\Setting;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class SyncRecordings extends Command
{
    protected $signature = 'app:sync-recordings';
    protected $description = 'Limpia la base de datos de archivos que ya no existen físicamente.';

    public function handle()
    {
        // 1. Verificar si la opción está activa en Configuración
        $hideBroken = Setting::where('key', 'hide_broken_links')->value('value');
        $frequency = (int) (Setting::where('key', 'scan_frequency')->value('value') ?? 30);

        if ($hideBroken !== '1') {
            $this->info('La sincronización automática está desactivada.');
            return;
        }

        // 2. Control de tiempo (Filtro para no saturar si corre cada minuto)
        $lastRun = Cache::get('last_sync_recordings_run');
        if ($lastRun) {
            $minutesSinceLastRun = Carbon::parse($lastRun)->diffInMinutes(now());
            if ($minutesSinceLastRun < $frequency) {
                $this->info("Aún no toca escanear. Faltan " . ($frequency - $minutesSinceLastRun) . " min.");
                return;
            }
        }

        $this->info('--- Iniciando limpieza de registros huérfanos ---');
        $deletedCount = 0;
        $checkedCount = 0;

        // 3. Procesar todos los archivos registrados
        Recording::chunkById(200, function ($recordings) use (&$deletedCount, &$checkedCount) {
            foreach ($recordings as $rec) {
                $checkedCount++;
                
                // Normalizar la ruta para evitar el error de la captura (barras mezcladas)
                $path = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $rec->full_path ?? $rec->path);

                
                if (!file_exists($path)) {
                    $this->warn("Eliminando de BD (No existe): " . $rec->filename);
                    $rec->delete();
                    $deletedCount++;
                }
            }
        });

        Cache::put('last_sync_recordings_run', now());

        $this->info("---------------------------------------------");
        $this->info("Proceso completado.");
        $this->info("Revisados: $checkedCount");
        $this->info("Eliminados: $deletedCount");
        
        Log::info("Limpieza automática: Revisados $checkedCount, Eliminados $deletedCount.");
    }
}