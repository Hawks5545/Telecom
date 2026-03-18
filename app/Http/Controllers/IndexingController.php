<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\AuditLog;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

class IndexingController extends Controller
{
    private function normalizePath($inputPath): string
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

    private function validatePath(string $path): ?array
    {
        // Bloquear path traversal
        if (str_contains($path, '..')) {
            return ['message' => 'La ruta contiene caracteres no permitidos.', 'code' => 400];
        }

        // Verificar que exista y sea un directorio
        if (!is_dir($path)) {
            return ['message' => 'La carpeta no existe o no es accesible en el servidor.', 'code' => 404];
        }

        return null; // null = sin errores
    }

    /**
     * ESCANEO PREVIO ASÍNCRONO
     */
    public function scanFolder(Request $request)
    {
        try {
            $path  = $this->normalizePath($request->input('path'));
            $error = $this->validatePath($path);

            if ($error) {
                return response()->json(['message' => $error['message']], $error['code']);
            }

            $jobId = uniqid('scan_');
            Cache::put("progress_{$jobId}", ['status' => 'scanning', 'percentage' => 0], 86400);

            $artisan = base_path('artisan');

            // < /dev/null desvincula stdin para evitar bloqueo del hilo PHP
            $comando = "nohup /usr/bin/php " . escapeshellarg($artisan)
                     . " telecom:scan " . escapeshellarg($path)
                     . " --job_id=" . $jobId
                     . " < /dev/null > " . base_path('storage/logs/scanner.log') . " 2>&1 &";
            
            Log::info("Comando de escaneo: " . $comando);
            
            shell_exec($comando);

            return response()->json([
                'status_type' => 'success',
                'job_id'      => $jobId,
                'message'     => 'Escaneo iniciado en segundo plano...'
            ], 200);

        } catch (\Throwable $e) {
            Log::error("Error al iniciar escaneo: " . $e->getMessage());
            return response()->json(['message' => 'Error: ' . $e->getMessage()], 500);
        }
    }

    /**
     * MOTOR DE INDEXACIÓN ASÍNCRONO
     */
    public function runIndexing(Request $request)
    {
        try {
            $rootPath = $this->normalizePath($request->input('path'));
            $error    = $this->validatePath($rootPath);

            if ($error) {
                return response()->json(['message' => $error['message']], $error['code']);
            }

            $this->logAudit(Auth::id(), 'Inicio de Indexación Asíncrona', "Ruta: $rootPath");

            $jobId = uniqid('job_');
            Cache::put("progress_{$jobId}", ['status' => 'starting', 'percentage' => 0], 86400);

            $artisan = base_path('artisan');

            $comando = "nohup /usr/bin/php " . escapeshellarg($artisan)
                     . " telecom:index " . escapeshellarg($rootPath)
                     . " --job_id=" . $jobId
                     . " < /dev/null > /dev/null 2> /dev/null &";

            shell_exec($comando);

            return response()->json([
                'status_type' => 'success',
                'job_id'      => $jobId,
                'message'     => 'Proceso iniciado en segundo plano.'
            ], 200);

        } catch (\Throwable $e) {
            Log::error("Error al iniciar indexación: " . $e->getMessage());
            return response()->json(['message' => 'Error al iniciar el proceso: ' . $e->getMessage()], 500);
        }
    }

    /**
     * VENTANILLA ÚNICA DE PROGRESO
     */
    public function getProgress(Request $request)
    {
        $jobId    = $request->input('job_id');
        $progress = Cache::get("progress_{$jobId}", [
            'status'     => 'not_found',
            'percentage' => 0
        ]);

        return response()->json($progress);
    }

    private function logAudit($userId, $action, $details)
    {
        try {
            AuditLog::create([
                'user_id'    => $userId,
                'action'     => $action,
                'details'    => $details,
                'ip_address' => request()->ip(),
            ]);
        } catch (\Exception $e) {}
    }
}
