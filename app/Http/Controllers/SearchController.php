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

    // --- 2. BÚSQUEDA OPTIMIZADA CON CONTEO EN CACHÉ ---
    public function search(Request $request)
    {
        if ($request->filled('cedula') && strlen($request->cedula) < 4) {
            return response()->json(['message' => 'Escribe al menos 4 números.'], 422);
        }

        $safeFilters = $request->only([
            'cedula', 'telefono', 'filename', 'dateFrom', 'dateTo', 'folderId', 'campana'
        ]);

        // ✅ CONTEO CON CACHÉ — no hace COUNT en cada petición de paginación
        $cacheKey   = 'search_count_' . md5(json_encode($safeFilters));
        $totalCount = Cache::remember($cacheKey, 300, function () use ($safeFilters) {
            return Recording::filter($safeFilters)->count();
        });

        $results = Recording::with('storageLocation:id,name')
            ->filter($safeFilters)
            ->orderBy('fecha_grabacion', 'desc')
            ->paginate(15)
            ->withQueryString();

        // Inyectamos el total cacheado
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
                [
                    'target_folder' => $targetLocation->name,
                    'count'         => $updatedCount,
                    'mode'          => 'virtual_move'
                ]
            );

            // Borrar solo las claves necesarias
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

    // --- 5. DESCARGA ZIP MASIVA CON ZIPSTREAM ---
    public function downloadZip(Request $request)
    {
        set_time_limit(0);

        $ids = $request->input('ids', []);

        if (empty($ids)) {
            return response()->json(['message' => 'Seleccione archivos.'], 400);
        }

        $maxLimit = 5000;
        if (count($ids) > $maxLimit) {
            return response()->json([
                'message' => "Límite excedido. Por seguridad, solo puedes descargar hasta {$maxLimit} archivos por ZIP."
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

        // Auditoría ANTES de iniciar el stream
        $this->auditAction(
            'Descarga ZIP',
            "ZIP con {$recordings->count()} archivos.",
            $request,
            ['file_count' => $recordings->count(), 'campaigns_breakdown' => $campaignCounts]
        );

        // STREAMING DIRECTO AL NAVEGADOR
        return response()->stream(function () use ($recordings, $zipName) {

            $zip = new ZipStream(
                outputName: $zipName,
                sendHttpHeaders: false,
            );

            foreach ($recordings as $rec) {
                if (!file_exists($rec->full_path)) continue;

                try {
                    $zip->addFileFromPath(
                        fileName: $rec->filename,
                        path: $rec->full_path,
                    );
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

    // Helper privado
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
