<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Recording;
use App\Models\StorageLocation;
use App\Models\AuditLog;
use ZipArchive;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;
use Illuminate\Support\Str;

class FolderManagerController extends Controller
{
    // --- 1. LISTAR CONTENIDO (ULTRA OPTIMIZADO) ---
    public function getItems(Request $request)
    {
        $parentId = (int) $request->input('parentId', 0);
        $search = $request->input('search');
        $dateFrom = $request->input('dateFrom');
        $dateTo = $request->input('dateTo');
        $viewType = $request->input('viewType', 'virtual');

        // NIVEL 0: LISTAR CARPETAS MADRE (Caché Inteligente y Agrupado)
        if ($parentId === 0) {

            $cacheKey = "folders_list_{$viewType}_" . md5($search . $dateFrom . $dateTo);

            // OPTIMIZACIÓN: 24 horas de caché normal, 60s si está usando filtros
            $cacheTime = ($search || $dateFrom || $dateTo) ? 60 : 86400;

            $folders = Cache::remember($cacheKey, $cacheTime, function () use ($search, $dateFrom, $dateTo, $viewType) {

                // 1. Traer solo las carpetas (Vuela en milisegundos)
                $query = StorageLocation::where('is_active', true);

                if ($viewType === 'virtual') {
                    $query->where('type', 'campaign');
                } else {
                    $query->where('type', 'inbox');
                }

                if ($search) $query->where('name', 'like', "%{$search}%");
                if ($dateFrom) $query->where('created_at', '>=', Carbon::parse($dateFrom)->startOfDay());
                if ($dateTo) $query->where('created_at', '<=', Carbon::parse($dateTo)->endOfDay());

                $locations = $query->orderBy('name', 'asc')->get();

                // 2. Extraer los IDs para buscar sus estadísticas de un solo golpe
                $locationIds = $locations->pluck('id')->toArray();

                // 3. Consulta cruda optimizada: Una sola pasada por la tabla gigante
                $stats = \Illuminate\Support\Facades\DB::table('recordings')
                    ->selectRaw('storage_location_id, COUNT(id) as items_count, SUM(size) as total_size')
                    ->whereIn('storage_location_id', $locationIds)
                    ->groupBy('storage_location_id')
                    ->get()
                    ->keyBy('storage_location_id');

                // 4. Mapear y unir los datos en la memoria RAM (Súper rápido)
                return $locations->map(function($loc) use ($stats) {
                    $folderStats = $stats->get($loc->id);
                    return [
                        'id' => $loc->id,
                        'parentId' => 0,
                        'name' => $loc->name,
                        'type' => 'folder',
                        'items' => $folderStats ? (int) $folderStats->items_count : 0,
                        'size_bytes' => $folderStats ? (int) $folderStats->total_size : 0,
                        'date' => $loc->created_at->format('Y-m-d'),
                        'path' => $loc->path,
                        'is_virtual' => $loc->type === 'campaign'
                    ];
                });
            });

            return response()->json($folders);
        }

        // NIVEL 1: LISTAR ARCHIVOS (Select limpio y SimplePaginate)
        $query = Recording::where('storage_location_id', $parentId);

        // OPTIMIZACIÓN: Solo traemos las columnas estrictamente necesarias
        $query->select('id', 'filename', 'size', 'fecha_grabacion', 'duration', 'cedula', 'campana', 'folder_path', 'storage_location_id');

        if ($search) {
             $query->where(function($q) use ($search) {
                $q->where('filename', 'like', "%{$search}%")
                  ->orWhere('cedula', 'like', "{$search}%")
                  ->orWhere('telefono', 'like', "{$search}%");
            });
        }
        if ($dateFrom) $query->where('fecha_grabacion', '>=', Carbon::parse($dateFrom)->startOfDay());
        if ($dateTo) $query->where('fecha_grabacion', '<=', Carbon::parse($dateTo)->endOfDay());

        // MAGIA: Adiós al lentísimo COUNT(*) de MySQL
        $files = $query->latest('fecha_grabacion')->simplePaginate(50);

        $formattedFiles = $files->getCollection()->map(function($file) use ($parentId) {
            return [
                'id' => $file->id,
                'parentId' => $parentId,
                'name' => $file->filename,
                'type' => 'file',
                'items' => 0,
                'size_bytes' => (int) $file->size,
                'date' => $file->fecha_grabacion ? $file->fecha_grabacion->format('Y-m-d H:i') : 'N/A',
                'duration' => gmdate("H:i:s", $file->duration ?? 0),
                'meta' => [
                    'cedula' => $file->cedula,
                    'campana' => $file->campana,
                    'folder' => $file->folder_path
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
                'type' => 'campaign',
                'name' => $request->name,
                'path' => $virtualPath,
                'is_active' => true,
                'description' => 'Campaña Virtual'
            ]);

            $this->logAudit('Crear Carpeta', "Nueva campaña virtual: {$request->name}", $request);

            Cache::flush();

            return response()->json([
                'message' => 'Carpeta creada exitosamente.',
                'folder' => $folder
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

        Cache::flush();

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

        Cache::flush();

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
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Expires' => '0',
        ]);
    }

    // --- 6. DESCARGA ZIP DE CARPETA COMPLETA (Blindada) ---
    public function downloadFolder(Request $request, $id)
    {
        set_time_limit(0);
        ini_set('memory_limit', '512M');

        try {
            $location = StorageLocation::findOrFail($id);

            // OPTIMIZACIÓN: Limitamos a 2000 archivos para que el servidor no explote por falta de RAM
            $recordings = Recording::where('storage_location_id', $id)
                ->select('id', 'filename', 'full_path', 'folder_path')
                ->limit(2000)
                ->get();

            if ($recordings->isEmpty()) return response()->json(['message' => 'La carpeta está vacía.'], 400);

            $tempDir = storage_path('app/temp_zips');
            if (!File::exists($tempDir)) File::makeDirectory($tempDir, 0755, true);

            $zipName = 'Campana_' . Str::slug($location->name) . '_' . date('Ymd_Hi') . '.zip';
            $zipPath = $tempDir . '/' . $zipName;

            $zip = new ZipArchive;
            if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) === TRUE) {
                $filesAdded = 0;

                foreach ($recordings as $rec) {
                    if (file_exists($rec->full_path)) {
                        $zip->addFile($rec->full_path, $rec->filename);
                        $filesAdded++;
                    }
                }
                $zip->close();

                if ($filesAdded === 0) return response()->json(['message' => 'Archivos físicos no encontrados.'], 404);

                $mensajeAuditoria = "Carpeta: {$location->name} ($filesAdded archivos).";
                if ($recordings->count() == 2000) {
                    $mensajeAuditoria .= " (Se aplicó límite de seguridad de 2000 archivos)";
                }

                $this->logAudit(
                    'Descarga ZIP Folder',
                    $mensajeAuditoria,
                    $request,
                    ['campaign' => $location->name, 'file_count' => $filesAdded]
                );

                return response()->download($zipPath, $zipName)->deleteFileAfterSend(true);
            }
            return response()->json(['message' => 'Error al crear ZIP.'], 500);

        } catch (\Exception $e) {
            Log::error("Folder ZIP Error: " . $e->getMessage());
            return response()->json(['message' => 'Error interno.'], 500);
        }
    }

    // --- HELPER PRIVADO ---
    private function logAudit($action, $details, $request, $metadata = []) {
        try {
            AuditLog::create([
                'user_id' => Auth::id(),
                'action' => $action,
                'details' => $details,
                'metadata' => json_encode($metadata),
                'ip_address' => $request->ip()
            ]);
        } catch (\Exception $e) { report($e); }
    }
}
