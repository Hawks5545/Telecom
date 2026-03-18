<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class ScanRecordings extends Command
{
    protected $signature   = 'telecom:scan {path} {--job_id=}';
    protected $description = 'Escanea una carpeta y guarda conteo y peso en caché.';

    public function handle()
    {
        $path  = $this->argument('path');
        $jobId = $this->option('job_id');

        // Conteo con timeout de 1 hora para evitar bloqueos eternos en NFS/rutas rotas
        $countCmd = "timeout 3600 find " . escapeshellarg($path)
          . " -type f -iregex '.*\.\(mp3\|wav\|ogg\|aac\|wma\)$' 2>/dev/null | wc -l";
        $fileCount = (int) shell_exec($countCmd);

        // Peso total con timeout
        $sizeCmd = "timeout 3600 du -sb " . escapeshellarg($path) . " 2>/dev/null | cut -f1";
        $totalSizeBytes = (int) shell_exec($sizeCmd);

        // Guardar resultado con TTL de 24 horas
        Cache::put("progress_{$jobId}", [
            'status'      => 'completed',
            'percentage'  => 100,
            'files_count' => $fileCount,
            'size_mb'     => round($totalSizeBytes / 1024 / 1024, 2),
        ], 86400);
    }
}
