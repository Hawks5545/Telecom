<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Recording;
use App\Models\StorageLocation;
use App\Models\AuditLog;
use ZipArchive;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB; 
use Illuminate\Support\Facades\Cache; // NUEVO: Para sincronizar el Dashboard

class SearchController extends Controller
{
    // --- 1. OBTENER CARPETAS ---
    public function getFolders()
    {
        return response()->json(
            StorageLocation::where('is_active', true)
                ->select('id', 'name', 'path') 
                ->orderBy('name')
                ->get()
        );
    }

    // --- 2. BÚSQUEDA (Segurizada) ---
    public function search(Request $request)
    {
        if ($request->filled('cedula') && strlen($request->cedula) < 4) {
            return response()->json(['message' => 'Escribe al menos 4 números.'], 422);
        }

        // SEGURIDAD: Nunca pasar request->all() directo a un scope.
        // Extraemos explícitamente solo los parámetros válidos que tu modelo espera.
        $safeFilters = $request->only([
            'cedula', 'telefono', 'filename', 'dateFrom', 'dateTo', 'folder_id', 'campana'
        ]);

        $results = Recording::with('storageLocation:id,name') 
            ->filter($safeFilters) // Ahora es 100% seguro contra inyección
            ->orderBy('fecha_grabacion', 'desc')
            ->paginate(15)
            ->withQueryString();

        return response()->json($results);
    }

    // --- 3. MOVER GRABACIONES (Sincronizado) ---
    public function moveRecordings(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'target_folder_id' => 'required|exists:storage_locations,id'
        ]);

        return DB::transaction(function () use ($request) {
            $targetLocation = StorageLocation::findOrFail($request->target_folder_id);
            
            // ACTUALIZACIÓN MASIVA
            $updatedCount = Recording::whereIn('id', $request->ids)
                ->update([
                    'storage_location_id' => $targetLocation->id,
                    'campana' => $targetLocation->name 
                ]);

            // Auditoría
            $this->auditAction(
                'Mover Grabaciones', 
                "Reasignó $updatedCount archivos a campaña: {$targetLocation->name}", 
                $request,
                [
                    'target_folder' => $targetLocation->name,
                    'count' => $updatedCount,
                    'mode' => 'virtual_move'
                ]
            );

            // OPTIMIZACIÓN Y SINCRONIZACIÓN: 
            // Al mover archivos, los totales cambian. Borramos el caché para que
            // el Dashboard y el Gestor de carpetas se actualicen de inmediato.
            Cache::flush();

            return response()->json([
                'message' => "Proceso exitoso. Se movieron $updatedCount grabaciones a {$targetLocation->name}.",
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
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Expires' => '0',
        ]);
    }

    // --- 5. DESCARGA ZIP MASIVA (Blindada) ---
    public function downloadZip(Request $request)
    {
        set_time_limit(0);
        ini_set('memory_limit', '512M');

        $ids = $request->input('ids', []);
        
        if (empty($ids)) {
            return response()->json(['message' => 'Seleccione archivos.'], 400);
        }

        // SEGURIDAD: Límite anti-colapso. 
        // Evita que un usuario intente descargar 50,000 audios de golpe y tire el servidor.
        $maxLimit = 1500;
        if (count($ids) > $maxLimit) {
            return response()->json(['message' => "Límite excedido. Por seguridad, solo puedes descargar hasta {$maxLimit} archivos por ZIP."], 422);
        }

        $recordings = Recording::with('storageLocation:id,name') 
            ->whereIn('id', $ids)
            ->select('id', 'filename', 'full_path', 'storage_location_id') 
            ->get();
        
        if ($recordings->isEmpty()) return response()->json(['message' => 'Archivos no encontrados.'], 404);

        $tempDir = storage_path('app/temp_zips');
        if (!File::exists($tempDir)) File::makeDirectory($tempDir, 0755, true);

        $zipName = 'Seleccion_' . date('Ymd_His') . '.zip';
        $zipPath = $tempDir . '/' . $zipName;

        $zip = new ZipArchive;
        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) === TRUE) {
            $filesAdded = 0;
            $campaignCounts = [];

            foreach ($recordings as $rec) {
                if (file_exists($rec->full_path)) {
                    $zip->addFile($rec->full_path, $rec->filename);
                    $filesAdded++;
                    
                    $campName = $rec->storageLocation->name ?? 'General';
                    if (!isset($campaignCounts[$campName])) $campaignCounts[$campName] = 0;
                    $campaignCounts[$campName]++;
                }
            }
            $zip->close();

            if ($filesAdded === 0) return response()->json(['message' => 'Ningún archivo físico encontrado.'], 404);

            $this->auditAction(
                'Descarga ZIP', 
                "ZIP con $filesAdded archivos.", 
                $request,
                ['file_count' => $filesAdded, 'campaigns_breakdown' => $campaignCounts]
            );

            return response()->download($zipPath, $zipName)->deleteFileAfterSend(true);
        }

        return response()->json(['message' => 'Error crítico al generar ZIP.'], 500);
    }

    // Helper privado
    private function auditAction($action, $details, $request, $metadata = [])
    {
        try {
            AuditLog::create([
                'user_id' => Auth::id(),
                'action' => $action,
                'details' => $details,
                'metadata' => json_encode($metadata),
                'ip_address' => $request->ip()
            ]);
        } catch (\Exception $e) { 
            report($e); 
        }
    }
}