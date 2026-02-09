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
use Carbon\Carbon;

class FolderManagerController extends Controller
{
    public function getItems(Request $request)
    {
        $parentId = $request->input('parentId', 0);
        $search = $request->input('search');
        $dateFrom = $request->input('dateFrom');
        $dateTo = $request->input('dateTo');

        // NIVEL RAÍZ
        if ($parentId == 0) {
            $query = StorageLocation::where('is_active', true);
            if ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")->orWhere('path', 'like', "%{$search}%");
                });
            }
            if ($dateFrom) $query->where('created_at', '>=', Carbon::parse($dateFrom)->startOfDay());
            if ($dateTo) $query->where('created_at', '<=', Carbon::parse($dateTo)->endOfDay());

            $locations = $query->orderBy('created_at', 'desc')->get();
            return response()->json($locations->map(function($loc) {
                $totalSizeBytes = Recording::where('storage_location_id', $loc->id)->sum('size');
                return [
                    'id' => $loc->id, 'parentId' => 0, 'name' => $loc->name ?? $loc->path,
                    'type' => 'folder', 'items' => Recording::where('storage_location_id', $loc->id)->count(),
                    'size_bytes' => $totalSizeBytes, 'date' => $loc->created_at->format('Y-m-d'), 'path' => $loc->path
                ];
            }));
        }

        // NIVEL ARCHIVOS
        $query = Recording::where('storage_location_id', $parentId);
        if ($search) {
             $query->where(function($q) use ($search) {
                $q->where('filename', 'like', "%{$search}%")->orWhere('cedula', 'like', "%{$search}%")
                  ->orWhere('telefono', 'like', "%{$search}%")->orWhere('campana', 'like', "%{$search}%");
            });
        }
        if ($dateFrom) $query->where('fecha_grabacion', '>=', Carbon::parse($dateFrom)->startOfDay());
        if ($dateTo) $query->where('fecha_grabacion', '<=', Carbon::parse($dateTo)->endOfDay());

        $files = $query->latest('original_created_at')->paginate(50); 
        $formattedCollection = collect($files->items())->map(function($file) use ($parentId) {
            $displayDate = $file->original_created_at ? $file->original_created_at->format('Y-m-d H:i') : ($file->fecha_grabacion ? $file->fecha_grabacion->format('Y-m-d H:i') : 'N/A');
            return [
                'id' => $file->id, 'parentId' => $parentId, 'name' => $file->filename,
                'type' => 'file', 'items' => 0, 'size_bytes' => $file->size,
                'date' => $displayDate, 'duration' => gmdate("H:i:s", $file->duration ?? 0),
                'meta' => [ 'cedula' => $file->cedula, 'campana' => $file->campana, 'folder' => $file->folder_path ]
            ];
        });
        $files->setCollection($formattedCollection);
        return response()->json($files);
    }

    // --- DESCARGA INDIVIDUAL ---
    public function downloadItem(Request $request, $id) 
    {
        $recording = Recording::findOrFail($id);
        $pathToUse = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $recording->full_path ?? $recording->path);

        if (!file_exists($pathToUse)) {
            return response()->json(['message' => 'Archivo no encontrado en disco.'], 404);
        }

        try {
            $campana = $recording->campana ?? 'General';
            AuditLog::create([
                'user_id' => Auth::id(),
                'action' => 'Descarga',
                'details' => "Descarga individual: {$recording->filename}. Campaña: {$campana}",
                'ip_address' => $request->ip()
            ]);
        } catch (\Exception $e) { Log::error("Audit Error: " . $e->getMessage()); }

        $headers = [
            'Cache-Control' => 'no-cache, no-store, must-revalidate, max-age=0',
            'Pragma' => 'no-cache',
            'Expires' => 'Sat, 01 Jan 2000 00:00:00 GMT',
        ];

        return response()->download($pathToUse, $recording->filename, $headers);
    }

    // --- DESCARGA ZIP DE CARPETA (MEJORADA) ---
    public function downloadFolder(Request $request, $id) 
    {
        try {
            if (!class_exists('ZipArchive')) return response()->json(['message' => 'PHP ZipArchive no habilitado.'], 500);

            $location = StorageLocation::findOrFail($id);
            $recordings = Recording::where('storage_location_id', $id)->get();

            if ($recordings->isEmpty()) return response()->json(['message' => 'La carpeta está vacía.'], 400);

            // --- LÓGICA NUEVA: CONTAR POR CAMPAÑA ---
            $campaignCounts = $recordings->map(fn($r) => $r->campana ?: 'General')->countBy();
            $campaignString = $campaignCounts->map(fn($count, $name) => "$name:$count")->implode(', ');
            // ----------------------------------------

            $tempDir = storage_path('app/temp');
            if (!File::exists($tempDir)) File::makeDirectory($tempDir, 0755, true);

            $cleanName = preg_replace('/[^A-Za-z0-9\-]/', '_', $location->name ?? 'Export');
            $zipName = 'backup_' . $cleanName . '_' . date('His') . '.zip';
            $zipPath = $tempDir . '/' . $zipName; 

            $zip = new ZipArchive;
            if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) === TRUE) {
                $filesAdded = 0;
                foreach ($recordings as $rec) {
                    $realPath = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $rec->full_path ?? $rec->path);
                    if (file_exists($realPath)) {
                        $zipInternalPath = ($rec->folder_path ? $rec->folder_path . '/' : '') . $rec->filename;
                        $zip->addFile($realPath, $zipInternalPath);
                        $filesAdded++;
                    }
                }
                $zip->close();

                if ($filesAdded === 0) {
                    if (file_exists($zipPath)) unlink($zipPath);
                    return response()->json(['message' => 'Error: Archivos no encontrados.'], 404);
                }

                try {
                    AuditLog::create([
                        'user_id' => Auth::id(),
                        'action' => 'Descarga ZIP Folder',
                        'details' => "Carpeta descargada: {$location->name} ($filesAdded archivos). Campañas: {{$campaignString}}",
                        'ip_address' => $request->ip()
                    ]);
                } catch (\Exception $e) { Log::error("Audit Error: " . $e->getMessage()); }

                $headers = [
                    'Cache-Control' => 'no-cache, no-store, must-revalidate, max-age=0',
                    'Pragma' => 'no-cache',
                    'Expires' => 'Sat, 01 Jan 2000 00:00:00 GMT',
                ];

                return response()->download($zipPath, $zipName, $headers)->deleteFileAfterSend(true);
            }
            return response()->json(['message' => 'Error creando ZIP.'], 500);
        } catch (\Throwable $e) {
            Log::error("ZIP Error: " . $e->getMessage());
            return response()->json(['message' => 'Error interno: ' . $e->getMessage()], 500);
        }
    }
}