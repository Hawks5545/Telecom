<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\AuditLog;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

class IndexingController extends Controller
{
    private function normalizePath($inputPath)
    {
        $path = trim($inputPath, " \t\n\r\0\x0B\"'");
        $path = str_replace('\\', '/', $path);
        $path = rtrim($path, '/');
        if (file_exists($path)) {
            $realPath = realpath($path);
            if ($realPath) return str_replace('\\', '/', $realPath);
        }
        return $path;
    }

    /**
     * ESCANEO PREVIO ASÍNCRONO: Para evitar timeouts en carpetas gigantes
     */
    public function scanFolder(Request $request)
    {
        try {
            $path = $this->normalizePath($request->input('path'));

            if (!is_dir($path)) {
                return response()->json(['message' => "La carpeta no existe o no es accesible."], 404);
            }

            $jobId = uniqid('scan_');
            Cache::put("progress_{$jobId}", ['status' => 'scanning', 'percentage' => 0], 120);

            $artisan = base_path('artisan');
            
            // Lanzamos un comando que solo cuente y mida, y guarde el resultado en Cache
            // Nota: Debes tener el comando telecom:scan creado o usar esta lógica de fondo
            $comando = "nohup /usr/bin/php " . escapeshellarg($artisan) . " telecom:scan " . escapeshellarg($path) . " --job_id=" . escapeshellarg($jobId) . " < /dev/null > /dev/null 2> /dev/null &";
            
            shell_exec($comando);

            return response()->json([
                'status_type' => 'success',
                'job_id' => $jobId,
                'message' => 'Escaneo iniciado en segundo plano...'
            ], 200);

        } catch (\Throwable $e) {
            return response()->json(['message' => 'Error: ' . $e->getMessage()], 500);
        }
    }

    /**
     * MOTOR DE INDEXACIÓN: Desenganche Absoluto
     */
    public function runIndexing(Request $request)
    {
        try {
            $rootPath = $this->normalizePath($request->input('path'));

            if (!is_dir($rootPath)) {
                return response()->json(['message' => 'La carpeta no existe físicamente.'], 404);
            }

            $this->logAudit(Auth::id(), 'Inicio de Indexación Asíncrona', "Ruta: $rootPath");

            $jobId = uniqid('job_');
            Cache::put("progress_{$jobId}", ['status' => 'starting', 'percentage' => 0], 120);

            $artisan = base_path('artisan');
            
            // < /dev/null > /dev/null 2> /dev/null & es el secreto del desenganche
            $comando = "nohup /usr/bin/php " . escapeshellarg($artisan) . " telecom:index " . escapeshellarg($rootPath) . " --job_id=" . escapeshellarg($jobId) . " < /dev/null > /dev/null 2> /dev/null &";

            shell_exec($comando);

            return response()->json([
                'status_type' => 'success',
                'job_id' => $jobId,
                'message' => 'Proceso iniciado en segundo plano.'
            ], 200);

        } catch (\Throwable $e) {
            Log::error("Error al iniciar indexación: " . $e->getMessage());
            return response()->json(['message' => 'Error al iniciar el proceso: ' . $e->getMessage()], 500);
        }
    }

    /**
     * VENTANILLA ÚNICA DE PROGRESO: Lee cualquier Job (Escaneo o Indexación)
     */
    public function getProgress(Request $request)
    {
        $jobId = $request->input('job_id');
        $progress = Cache::get("progress_{$jobId}", [
            'status' => 'not_found',
            'percentage' => 0
        ]);

        return response()->json($progress);
    }

    private function logAudit($userId, $action, $details) {
        try {
            AuditLog::create([
                'user_id' => $userId, 'action' => $action,
                'details' => $details, 'ip_address' => request()->ip(),
            ]);
        } catch (\Exception $e) {}
    }
}
