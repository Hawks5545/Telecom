<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Recording;
use App\Models\StorageLocation;
use App\Models\AuditLog;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use ZipStream\ZipStream;

class SearchController extends Controller
{
    // --- HELPER: Verificar permiso ---
    private function verificarPermiso(string $permiso): bool
    {
        $user     = Auth::user();
        $user->load('role');
        $permisos = $user->role ? ($user->role->permissions ?? []) : [];
        return in_array('*', $permisos) || in_array($permiso, $permisos);
    }

    // --- 1. OBTENER CARPETAS ---
    public function getFolders()
    {
        $folders = Cache::remember('active_folders_list', 86400, function () {
            return StorageLocation::where('is_active', true)
                ->select('id', 'name', 'path')
                ->orderBy('name')
                ->get();
        });
        return response()->json($folders);
    }

    // --- 2. BÚSQUEDA ---
    public function search(Request $request)
    {
        if ($request->filled('cedula') && strlen($request->cedula) < 4) {
            return response()->json(['message' => 'Escribe al menos 4 números.'], 422);
        }

        $safeFilters = $request->only([
            'cedula', 'telefono', 'filename', 'dateFrom', 'dateTo', 'folderId', 'campana'
        ]);

        $cacheKey   = 'search_count_' . md5(json_encode($safeFilters));
        $totalCount = Cache::remember($cacheKey, 300, function () use ($safeFilters) {
            return Recording::filter($safeFilters)->count();
        });

        $results = Recording::with('storageLocation:id,name')
            ->filter($safeFilters)
            ->orderBy('fecha_grabacion', 'desc')
            ->paginate(15)
            ->withQueryString();

        $resultsArray              = $results->toArray();
        $resultsArray['total']     = $totalCount;
        $resultsArray['last_page'] = (int) ceil($totalCount / 15);

        return response()->json($resultsArray);
    }

    // --- 3. MOVER GRABACIONES ---
    public function moveRecordings(Request $request)
    {
        $request->validate([
            'ids'              => 'required|array',
            'target_folder_id' => 'required|exists:storage_locations,id'
        ]);

        return DB::transaction(function () use ($request) {
            $targetLocation = StorageLocation::findOrFail($request->target_folder_id);

            $updatedCount = Recording::whereIn('id', $request->ids)
                ->update([
                    'storage_location_id' => $targetLocation->id,
                    'campana'             => $targetLocation->name
                ]);

            $this->auditAction(
                'Mover Grabaciones',
                "Reasignó $updatedCount archivos a campaña: {$targetLocation->name}",
                $request,
                ['target_folder' => $targetLocation->name, 'count' => $updatedCount, 'mode' => 'virtual_move']
            );

            Cache::forget('active_folders_list');
            Cache::forget('dash_kpis_v14');
            foreach (['virtual', 'physical'] as $type) {
                Cache::forget("folders_list_{$type}_" . md5(''));
            }
            foreach (['day', 'week', 'month'] as $range) {
                Cache::forget("dash_charts_v13_{$range}");
            }

            \App\Http\Controllers\DashboardController::warmCache();

            return response()->json([
                'message'     => "Proceso exitoso. Se movieron $updatedCount grabaciones a {$targetLocation->name}.",
                'moved_count' => $updatedCount
            ]);
        });
    }

    // --- 4. DESCARGA INDIVIDUAL ---
    public function downloadItem(Request $request, $id)
    {
        if (!$this->verificarPermiso('Descargar Grabaciones')) {
            return response()->json(['message' => 'No tienes permiso para descargar grabaciones.'], 403);
        }

        $recording = Recording::findOrFail($id);
        $pathToUse = $recording->full_path;

        if (!file_exists($pathToUse)) {
            Log::error("Archivo perdido físicamente ID: {$id} Ruta: {$pathToUse}");
            return response()->json(['message' => 'El archivo no existe en el disco físico.'], 404);
        }

        $campaignName = $recording->storageLocation->name ?? 'General';

        $this->auditAction(
            'Descarga',
            "Individual: {$recording->filename}",
            $request,
            ['campaign' => $campaignName, 'file_size' => $recording->size]
        );

        return response()->download($pathToUse, $recording->filename, [
            'Cache-Control'  => 'no-cache, no-store, must-revalidate',
            'Content-Length' => filesize($pathToUse),
            'Expires'        => '0',
        ]);
    }

    // --- 5. DESCARGA ZIP MASIVA ---
    public function downloadZip(Request $request)
    {
        if (!$this->verificarPermiso('Descargar Grabaciones')) {
            return response()->json(['message' => 'No tienes permiso para descargar grabaciones.'], 403);
        }

        set_time_limit(0);

        $ids = $request->input('ids', []);

        if (empty($ids)) {
            return response()->json(['message' => 'Seleccione archivos.'], 400);
        }

        if (count($ids) > 5000) {
            return response()->json([
                'message' => "Límite excedido. Solo puedes descargar hasta 5,000 archivos por ZIP."
            ], 422);
        }

        $recordings = Recording::with('storageLocation:id,name')
            ->whereIn('id', $ids)
            ->select('id', 'filename', 'full_path', 'storage_location_id')
            ->get();

        if ($recordings->isEmpty()) {
            return response()->json(['message' => 'Archivos no encontrados.'], 404);
        }

        $zipName        = 'Seleccion_' . date('Ymd_His') . '.zip';
        $campaignCounts = [];

        foreach ($recordings as $rec) {
            $campName = $rec->storageLocation->name ?? 'General';
            if (!isset($campaignCounts[$campName])) $campaignCounts[$campName] = 0;
            $campaignCounts[$campName]++;
        }

        $this->auditAction(
            'Descarga ZIP',
            "ZIP con {$recordings->count()} archivos.",
            $request,
            ['file_count' => $recordings->count(), 'campaigns_breakdown' => $campaignCounts]
        );

        return response()->stream(function () use ($recordings, $zipName) {
            $zip = new ZipStream(outputName: $zipName, sendHttpHeaders: false);
            foreach ($recordings as $rec) {
                if (!file_exists($rec->full_path)) continue;
                try {
                    $zip->addFileFromPath(fileName: $rec->filename, path: $rec->full_path);
                } catch (\Exception $e) {
                    Log::warning("ZipStream: No se pudo agregar {$rec->filename}: " . $e->getMessage());
                }
            }
            $zip->finish();
        }, 200, [
            'Content-Type'        => 'application/zip',
            'Content-Disposition' => 'attachment; filename="' . $zipName . '"',
            'Cache-Control'       => 'no-cache, no-store, must-revalidate',
            'X-Accel-Buffering'   => 'no',
            'Expires'             => '0',
        ]);
    }

    // --- 6. STREAMING DE AUDIO ---
    public function streamAudio(Request $request, $id)
    {
        $token = $request->query('auth_token');
        if (!$token) {
            return response()->json(['message' => 'No autorizado.'], 401);
        }

        $personalToken = \Laravel\Sanctum\PersonalAccessToken::findToken($token);
        if (!$personalToken || !$personalToken->tokenable) {
            return response()->json(['message' => 'Token inválido o expirado.'], 401);
        }

        $user         = $personalToken->tokenable;
        $user->load('role');
        $permisos     = $user->role ? ($user->role->permissions ?? []) : [];
        $tienePermiso = in_array('*', $permisos) || in_array('Reproducir Audio', $permisos);

        if (!$tienePermiso) {
            return response()->json(['message' => 'No tienes permiso para reproducir audio.'], 403);
        }

        $recording = Recording::findOrFail($id);

        if (!file_exists($recording->full_path)) {
            return response()->json(['message' => 'Archivo no encontrado en el servidor.'], 404);
        }

        $mimeTypes = [
            'mp3' => 'audio/mpeg',
            'wav' => 'audio/wav',
            'ogg' => 'audio/ogg',
            'aac' => 'audio/aac',
            'wma' => 'audio/x-ms-wma',
        ];

        $ext      = strtolower(pathinfo($recording->full_path, PATHINFO_EXTENSION));
        $mimeType = $mimeTypes[$ext] ?? 'audio/mpeg';
        $fileSize = filesize($recording->full_path);

        $start   = 0;
        $end     = $fileSize - 1;
        $status  = 200;
        $headers = [
            'Content-Type'        => $mimeType,
            'Content-Length'      => $fileSize,
            'Accept-Ranges'       => 'bytes',
            'Cache-Control'       => 'no-cache',
            'X-Accel-Buffering'   => 'no',
            'Content-Disposition' => 'inline; filename="' . $recording->filename . '"',
        ];

        if ($request->hasHeader('Range')) {
            $range = $request->header('Range');
            preg_match('/bytes=(\d+)-(\d*)/', $range, $matches);
            $start  = (int) $matches[1];
            $end    = isset($matches[2]) && $matches[2] !== '' ? (int) $matches[2] : $fileSize - 1;
            $length = $end - $start + 1;
            $status = 206;
            $headers['Content-Length'] = $length;
            $headers['Content-Range']  = "bytes {$start}-{$end}/{$fileSize}";
        }

        return response()->stream(function () use ($recording, $start, $end) {
            $handle    = fopen($recording->full_path, 'rb');
            fseek($handle, $start);
            $remaining = $end - $start + 1;
            while (!feof($handle) && $remaining > 0) {
                $chunk     = min(8192, $remaining);
                echo fread($handle, $chunk);
                $remaining -= $chunk;
                flush();
            }
            fclose($handle);
        }, $status, $headers);
    }

    private function auditAction($action, $details, $request, $metadata = [])
    {
        try {
            AuditLog::create([
                'user_id'    => Auth::id(),
                'action'     => $action,
                'details'    => $details,
                'metadata'   => json_encode($metadata),
                'ip_address' => $request->ip()
            ]);
        } catch (\Exception $e) {
            report($e);
        }
    }
}
