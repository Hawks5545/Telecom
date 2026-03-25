<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Recording;
use App\Models\StorageLocation;
use App\Models\AuditLog;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;
use Illuminate\Support\Str;
use ZipStream\ZipStream;

class FolderManagerController extends Controller
{
    // --- 1. LISTAR CONTENIDO ---
    public function getItems(Request $request)
    {
        $parentId = (int) $request->input('parentId', 0);
        $search   = $request->input('search');
        $dateFrom = $request->input('dateFrom');
        $dateTo   = $request->input('dateTo');
        $viewType = $request->input('viewType', 'virtual');

        if ($parentId === 0) {
            $cacheKey  = "folders_list_{$viewType}_" . md5($search . $dateFrom . $dateTo);
            $cacheTime = ($search || $dateFrom || $dateTo) ? 60 : 86400;

            $folders = Cache::remember($cacheKey, $cacheTime, function () use ($search, $dateFrom, $dateTo, $viewType) {
                $query = StorageLocation::where('is_active', true);

                if ($viewType === 'virtual') {
                    $query->where('type', 'campaign');
                } else {
                    $query->where('type', 'inbox');
                }

                if ($search)   $query->where('name', 'like', "%{$search}%");
                if ($dateFrom) $query->where('created_at', '>=', Carbon::parse($dateFrom)->startOfDay());
                if ($dateTo)   $query->where('created_at', '<=', Carbon::parse($dateTo)->endOfDay());

                $locations   = $query->orderBy('name', 'asc')->get();
                $locationIds = $locations->pluck('id')->toArray();

                $stats = \Illuminate\Support\Facades\DB::table('recordings')
                    ->selectRaw('storage_location_id, COUNT(id) as items_count, SUM(size) as total_size')
                    ->whereIn('storage_location_id', $locationIds)
                    ->groupBy('storage_location_id')
                    ->get()
                    ->keyBy('storage_location_id');

                return $locations->map(function ($loc) use ($stats) {
                    $folderStats = $stats->get($loc->id);
                    return [
                        'id'         => $loc->id,
                        'parentId'   => 0,
                        'name'       => $loc->name,
                        'type'       => 'folder',
                        'items'      => $folderStats ? (int) $folderStats->items_count : 0,
                        'size_bytes' => $folderStats ? (int) $folderStats->total_size : 0,
                        'date'       => $loc->created_at->format('Y-m-d'),
                        'path'       => $loc->path,
                        'is_virtual' => $loc->type === 'campaign'
                    ];
                });
            });

            return response()->json($folders);
        }

        $query = Recording::where('storage_location_id', $parentId)
            ->select('id', 'filename', 'size', 'fecha_grabacion', 'duration', 'cedula', 'campana', 'folder_path', 'storage_location_id');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('filename', 'like', "%{$search}%")
                  ->orWhere('cedula', 'like', "{$search}%")
                  ->orWhere('telefono', 'like', "{$search}%");
            });
        }
        if ($dateFrom) $query->where('fecha_grabacion', '>=', Carbon::parse($dateFrom)->startOfDay());
        if ($dateTo)   $query->where('fecha_grabacion', '<=', Carbon::parse($dateTo)->endOfDay());

        $files          = $query->latest('fecha_grabacion')->simplePaginate(50);
        $formattedFiles = $files->getCollection()->map(function ($file) use ($parentId) {
            return [
                'id'         => $file->id,
                'parentId'   => $parentId,
                'name'       => $file->filename,
                'type'       => 'file',
                'items'      => 0,
                'size_bytes' => (int) $file->size,
                'date'       => $file->fecha_grabacion ? $file->fecha_grabacion->format('Y-m-d H:i') : 'N/A',
                'duration'   => gmdate("H:i:s", $file->duration ?? 0),
                'meta'       => [
                    'cedula'  => $file->cedula,
                    'campana' => $file->campana,
                    'folder'  => $file->folder_path
                ]
            ];
        });

        $files->setCollection($formattedFiles);
        return response()->json($files);
    }

    // --- 2. CREAR CARPETA VIRTUAL ---
    public function createFolder(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:storage_locations,name',
        ]);

        try {
            $virtualPath = 'VIRTUAL/' . Str::slug($request->name, '_') . '_' . time();

            $folder = StorageLocation::create([
                'type'        => 'campaign',
                'name'        => $request->name,
                'path'        => $virtualPath,
                'is_active'   => true,
                'description' => 'Campaña Virtual'
            ]);

            $this->logAudit('Crear Carpeta', "Nueva campaña virtual: {$request->name}", $request);

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
                'message' => 'Carpeta creada exitosamente.',
                'folder'  => $folder
            ], 201);

        } catch (\Exception $e) {
            Log::error("Error creando carpeta virtual: " . $e->getMessage());
            return response()->json(['message' => 'Error al registrar la carpeta.'], 500);
        }
    }

    // --- 3. ELIMINAR CARPETA ---
    public function deleteFolder(Request $request, $id)
    {
        $folder = StorageLocation::findOrFail($id);

        if ($folder->recordings()->count() > 0) {
            return response()->json([
                'message' => 'No puedes eliminar una carpeta que contiene grabaciones. Múevelas o bórralas primero.'
            ], 400);
        }

        $folderName = $folder->name;
        $folder->delete();

        $this->logAudit('Eliminar Carpeta', "Eliminó la carpeta: {$folderName}", $request);

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

        return response()->json(['message' => 'Carpeta eliminada correctamente.']);
    }

    // --- 4. EDITAR CARPETA ---
    public function updateFolder(Request $request, $id)
    {
        $folder = StorageLocation::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255|unique:storage_locations,name,' . $id
        ]);

        $oldName = $folder->name;
        $folder->update(['name' => $request->name]);

        $this->logAudit('Renombrar Carpeta', "Cambió nombre de '{$oldName}' a '{$request->name}'", $request);

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

        return response()->json(['message' => 'Carpeta actualizada.', 'folder' => $folder]);
    }

    // --- 5. DESCARGA INDIVIDUAL ---
    public function downloadItem(Request $request, $id)
    {
        $recording = Recording::findOrFail($id);

        if (!file_exists($recording->full_path)) {
            return response()->json(['message' => 'Archivo físico no encontrado en el servidor.'], 404);
        }

        $campaignName = $recording->storageLocation->name ?? 'General';

        $this->logAudit(
            'Descarga',
            "Individual: {$recording->filename}",
            $request,
            ['campaign' => $campaignName, 'file_size' => $recording->size]
        );

        return response()->download($recording->full_path, $recording->filename, [
            'Cache-Control'  => 'no-cache, no-store, must-revalidate',
            'Content-Length' => filesize($recording->full_path),
            'Expires'        => '0',
        ]);
    }

    // --- 6. DESCARGA ZIP DE CARPETA COMPLETA CON ZIPSTREAM ---
    public function downloadFolder(Request $request, $id)
    {
        set_time_limit(0);

        try {
            $location = StorageLocation::findOrFail($id);

            $totalCount = Recording::where('storage_location_id', $id)->count();
            if ($totalCount > 5000) {
                 return response()->json([
                     'message' => "Esta carpeta contiene {$totalCount} grabaciones y supera el límite de 5,000. Use el módulo de Búsqueda para filtrar las grabaciones que necesita."
                  ], 422);
            }

            $recordings = Recording::where('storage_location_id', $id)
           	 ->select('id', 'filename', 'full_path', 'folder_path')
            	->limit(5000)
           	 ->get();

            if ($recordings->isEmpty()) {
                return response()->json(['message' => 'La carpeta está vacía.'], 400);
            }

            $zipName = 'Campana_' . Str::slug($location->name) . '_' . date('Ymd_Hi') . '.zip';

            $mensajeAuditoria = "Carpeta: {$location->name} ({$recordings->count()} archivos).";
            if ($recordings->count() == 5000) {
                $mensajeAuditoria .= " (Se aplicó límite de seguridad de 5000 archivos)";
            }

            $this->logAudit(
                'Descarga ZIP Folder',
                $mensajeAuditoria,
                $request,
                ['campaign' => $location->name, 'file_count' => $recordings->count()]
            );

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
                        Log::warning("ZipStream Folder: No se pudo agregar {$rec->filename}: " . $e->getMessage());
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

        } catch (\Exception $e) {
            Log::error("Folder ZIP Error: " . $e->getMessage());
            return response()->json(['message' => 'Error interno.'], 500);
        }
    }

    // --- HELPER PRIVADO ---
    private function logAudit($action, $details, $request, $metadata = [])
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
