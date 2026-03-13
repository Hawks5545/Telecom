<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class ScanRecordings extends Command
{
    protected $signature = 'telecom:scan {path} {--job_id=}';

    public function handle()
    {
        $path = $this->argument('path');
        $jobId = $this->option('job_id');

        // Conteo rápido con Linux
        $countCmd = "find " . escapeshellarg($path) . " -type f -iregex '.*\.\(mp3\|wav\|ogg\|aac\|wma\)$' | wc -l";
        $fileCount = (int) shell_exec($countCmd);

        // Peso rápido con Linux
        $sizeCmd = "du -sb " . escapeshellarg($path) . " | cut -f1";
        $totalSizeBytes = (int) shell_exec($sizeCmd);

        // Guardamos el resultado en Cache para que React lo lea
        Cache::put("progress_{$jobId}", [
            'status' => 'completed',
            'percentage' => 100,
            'files_count' => $fileCount,
            'size_mb' => round($totalSizeBytes / 1024 / 1024, 2)
        ], 120);
    }
}
