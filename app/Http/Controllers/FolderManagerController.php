<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Recording;        
use App\Models\StorageLocation;  
use ZipArchive;                  

class FolderManagerController extends Controller
{
    
    public function getItems(Request $request)
    {
        $parentId = $request->input('parentId', 0);
        $search = $request->input('search');
        $dateFrom = $request->input('dateFrom');
        $dateTo = $request->input('dateTo');

        if ($parentId == 0) {
            $locations = StorageLocation::where('is_active', true)->get();
            $folders = $locations->map(function($loc) {
                return [
                    'id' => $loc->id,
                    'parentId' => 0,
                    'name' => $loc->name ?? $loc->path,
                    'type' => 'folder',
                    'items' => Recording::where('storage_location_id', $loc->id)->count(),
                    'date' => $loc->created_at->format('Y-m-d'),
                    'path' => $loc->path
                ];
            });
            return response()->json($folders);
        }

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

        $files = $query->latest('fecha_grabacion')->paginate(50);

        $formattedFiles = collect($files->items())->map(function($file) use ($parentId) {
            return [
                'id' => $file->id,
                'parentId' => $parentId,
                'name' => $file->filename,
                'type' => 'file',
                'items' => 0,
                'date' => $file->fecha_grabacion ? $file->fecha_grabacion->format('Y-m-d H:i') : 'N/A',
                'duration' => gmdate("H:i:s", $file->duration ?? 0),
                'meta' => [ 
                    'cedula' => $file->cedula,
                    'campana' => $file->campana
                ]
            ];
        });

        return response()->json($formattedFiles);
    }

    /*Descarga un ARCHIVO individual*/
    public function downloadItem($id)
    {
        $recording = Recording::findOrFail($id);
        if (!file_exists($recording->path)) {
            return response()->json(['message' => 'Archivo no encontrado en disco.'], 404);
        }
        return response()->download($recording->path, $recording->filename);
    }

    /*Descarga una CARPETA completa como ZIP*/
    public function downloadFolder($id)
    {
        // 1. Busca la carpeta (Ubicación)
        $location = StorageLocation::findOrFail($id);
        
        // 2. Busca todos sus archivos
        $recordings = Recording::where('storage_location_id', $id)->get();

        if ($recordings->isEmpty()) {
            return response()->json(['message' => 'La carpeta está vacía, nada que comprimir.'], 400);
        }

        // 3. Prepara el ZIP
        $zipName = 'carpeta_' . preg_replace('/[^A-Za-z0-9\-]/', '_', $location->name) . '_' . date('His') . '.zip';
        $tempPath = sys_get_temp_dir() . '/' . $zipName; 

        $zip = new ZipArchive;
        if ($zip->open($tempPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) === TRUE) {
            $filesAdded = 0;
            
            foreach ($recordings as $rec) {
                if (file_exists($rec->path)) {
                    // Añade el archivo al ZIP con su nombre original
                    $zip->addFile($rec->path, $rec->filename);
                    $filesAdded++;
                }
            }
            
            $zip->close();

            if ($filesAdded === 0) {
                return response()->json(['message' => 'Los archivos existen en base de datos pero no en el disco físico.'], 404);
            }

            // 4. Entregamos el ZIP y lo borramos del servidor al terminar
            return response()->download($tempPath)->deleteFileAfterSend(true);
        } else {
            return response()->json(['message' => 'No se pudo crear el archivo ZIP.'], 500);
        }
    }
}