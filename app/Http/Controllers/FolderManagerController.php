<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Recording;        
use App\Models\StorageLocation;  
use ZipArchive;                  
use Illuminate\Support\Facades\Log;
// Importamos File para manejar rutas y limpieza
use Illuminate\Support\Facades\File;

class FolderManagerController extends Controller
{
    public function getItems(Request $request)
    {
        $parentId = $request->input('parentId', 0);
        $search = $request->input('search');
        $dateFrom = $request->input('dateFrom');
        $dateTo = $request->input('dateTo');

        // --- NIVEL RAÍZ (CARPETAS/UBICACIONES) ---
        if ($parentId == 0) {
            $locations = StorageLocation::where('is_active', true)->get();
            
            return response()->json($locations->map(function($loc) {
                return [
                    'id' => $loc->id,
                    'parentId' => 0,
                    'name' => $loc->name ?? $loc->path,
                    'type' => 'folder',
                    'items' => Recording::where('storage_location_id', $loc->id)->count(),
                    'date' => $loc->created_at->format('Y-m-d'),
                    'path' => $loc->path
                ];
            }));
        }

        // --- NIVEL DE ARCHIVOS (GRABACIONES) ---
        $query = Recording::where('storage_location_id', $parentId);

        if ($search) {
             $query->where(function($q) use ($search) {
                $q->where('filename', 'like', "%{$search}%")
                  ->orWhere('cedula', 'like', "%{$search}%")
                  ->orWhere('telefono', 'like', "%{$search}%")
                  ->orWhere('campana', 'like', "%{$search}%");
            });
        }

        if ($dateFrom) $query->whereDate('fecha_grabacion', '>=', $dateFrom);
        if ($dateTo) $query->whereDate('fecha_grabacion', '<=', $dateTo);

        $files = $query->latest('original_created_at')->paginate(50); 

        $formattedFiles = collect($files->items())->map(function($file) use ($parentId) {
            $displayDate = 'N/A';
            if ($file->original_created_at) {
                $displayDate = $file->original_created_at->format('Y-m-d H:i');
            } elseif ($file->fecha_grabacion) {
                $displayDate = $file->fecha_grabacion->format('Y-m-d H:i');
            }

            return [
                'id' => $file->id,
                'parentId' => $parentId,
                'name' => $file->filename,
                'type' => 'file',
                'items' => 0,
                'date' => $displayDate,
                'duration' => gmdate("H:i:s", $file->duration ?? 0),
                'meta' => [ 
                    'cedula' => $file->cedula,
                    'campana' => $file->campana,
                    'folder' => $file->folder_path 
                ]
            ];
        });

        return response()->json($formattedFiles);
    }

    public function downloadItem($id)
    {
        $recording = Recording::findOrFail($id);
        $pathToUse = $recording->full_path ?? $recording->path;

        if (!file_exists($pathToUse)) {
            return response()->json(['message' => 'Archivo no encontrado en disco.'], 404);
        }
        return response()->download($pathToUse, $recording->filename);
    }

    // --- DESCARGA DE CARPETA COMPLETA (ZIP MEJORADO) ---
    public function downloadFolder($id)
    {
        try {
            // Verificar si la extensión ZIP está activa
            if (!class_exists('ZipArchive')) {
                return response()->json(['message' => 'La extensión PHP ZipArchive no está habilitada en el servidor.'], 500);
            }

            $location = StorageLocation::findOrFail($id);
            $recordings = Recording::where('storage_location_id', $id)->get();

            if ($recordings->isEmpty()) {
                return response()->json(['message' => 'La carpeta está vacía.'], 400);
            }

            // 1. Crear carpeta temporal dentro de Laravel (storage/app/temp)
            $tempDir = storage_path('app/temp');
            if (!File::exists($tempDir)) {
                File::makeDirectory($tempDir, 0755, true);
            }

            // 2. Definir nombre y ruta del ZIP
            $cleanName = preg_replace('/[^A-Za-z0-9\-]/', '_', $location->name ?? 'Export');
            $zipName = 'backup_' . $cleanName . '_' . date('His') . '.zip';
            $zipPath = $tempDir . '/' . $zipName; 

            $zip = new ZipArchive;
            if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) === TRUE) {
                $filesAdded = 0;
                
                foreach ($recordings as $rec) {
                    $realPath = $rec->full_path ?? $rec->path;

                    if (file_exists($realPath)) {
                        // Recrear estructura de carpetas
                        $zipInternalPath = ($rec->folder_path ? $rec->folder_path . '/' : '') . $rec->filename;
                        $zip->addFile($realPath, $zipInternalPath);
                        $filesAdded++;
                    }
                }
                
                $zip->close();

                if ($filesAdded === 0) {
                    // Si no se añadió nada, borramos el zip vacío si se creó
                    if (file_exists($zipPath)) unlink($zipPath);
                    return response()->json(['message' => 'Error: Los archivos existen en BD pero no físicamente.'], 404);
                }

                // 3. Entregar descarga y borrar después
                return response()->download($zipPath)->deleteFileAfterSend(true);
            }
            
            return response()->json(['message' => 'No se pudo crear el archivo ZIP (Permisos).'], 500);

        } catch (\Throwable $e) {
            Log::error("ZIP Error: " . $e->getMessage());
            return response()->json(['message' => 'Error interno: ' . $e->getMessage()], 500);
        }
    }
}