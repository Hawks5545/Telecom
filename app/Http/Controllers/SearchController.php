<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Recording;
use App\Models\StorageLocation;
use ZipArchive;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

class SearchController extends Controller
{
    // 1. Obtener lista de carpetas para el filtro
    public function getFolders()
    {
        return response()->json(StorageLocation::where('is_active', true)->select('id', 'path', 'name')->get());
    }

    // 2. Búsqueda Principal con Paginación
    public function search(Request $request)
    {
        $query = Recording::with('storageLocation'); // Eager loading para optimizar

        // --- FILTROS ---
        
        // Cédula (Coincidencia parcial)
        if ($request->filled('cedula')) {
            $query->where('cedula', 'like', '%' . $request->cedula . '%');
        }

        // [NUEVO] Filtro de Teléfono
        if ($request->filled('telefono')) {
            $query->where('telefono', 'like', '%' . $request->telefono . '%');
        }

        // Nombre/Cliente (Buscamos en el nombre del archivo)
        if ($request->filled('filename')) {
            $query->where('filename', 'like', '%' . $request->filename . '%');
        }

        // Fechas
        if ($request->filled('dateFrom')) {
            $query->whereDate('fecha_grabacion', '>=', $request->dateFrom);
        }
        if ($request->filled('dateTo')) {
            $query->whereDate('fecha_grabacion', '<=', $request->dateTo);
        }

        // Carpeta Específica
        if ($request->filled('folderId')) {
            $query->where('storage_location_id', $request->folderId);
        }

        // Campaña (Input de texto, búsqueda parcial)
        if ($request->filled('campana')) {
            $query->where('campana', 'like', '%' . $request->campana . '%');
        }

        // Ordenamiento y Paginación
        $results = $query->orderBy('fecha_grabacion', 'desc')->paginate(15);

        return response()->json($results);
    }

    // 3. Descarga Masiva (ZIP)
    public function downloadZip(Request $request)
    {
        $ids = $request->input('ids', []);

        if (empty($ids)) {
            return response()->json(['message' => 'No se seleccionaron archivos.'], 400);
        }

        $recordings = Recording::whereIn('id', $ids)->get();

        if ($recordings->isEmpty()) {
            return response()->json(['message' => 'Archivos no encontrados.'], 404);
        }

        // Crear carpeta temporal
        $tempDir = storage_path('app/temp');
        if (!File::exists($tempDir)) File::makeDirectory($tempDir, 0755, true);

        $zipName = 'seleccion_' . date('Ymd_His') . '.zip';
        $zipPath = $tempDir . '/' . $zipName;

        $zip = new ZipArchive;
        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) === TRUE) {
            $filesAdded = 0;

            foreach ($recordings as $rec) {
                $realPath = $rec->full_path ?? $rec->path;
                
                if (file_exists($realPath)) {
                    // Agregamos el archivo al ZIP con su nombre original
                    $zip->addFile($realPath, $rec->filename);
                    $filesAdded++;
                }
            }

            $zip->close();

            if ($filesAdded === 0) {
                return response()->json(['message' => 'Ninguno de los archivos seleccionados existe físicamente.'], 404);
            }

            return response()->download($zipPath)->deleteFileAfterSend(true);
        }

        return response()->json(['message' => 'Error al crear el archivo ZIP.'], 500);
    }
}