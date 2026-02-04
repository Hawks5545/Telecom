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
        $query = Recording::with('storageLocation'); 

        // --- FILTROS ---
        if ($request->filled('cedula')) {
            $query->where('cedula', 'like', '%' . $request->cedula . '%');
        }
        if ($request->filled('telefono')) {
            $query->where('telefono', 'like', '%' . $request->telefono . '%');
        }
        if ($request->filled('filename')) {
            $query->where('filename', 'like', '%' . $request->filename . '%');
        }
        if ($request->filled('dateFrom')) {
            $query->whereDate('fecha_grabacion', '>=', $request->dateFrom);
        }
        if ($request->filled('dateTo')) {
            $query->whereDate('fecha_grabacion', '<=', $request->dateTo);
        }
        if ($request->filled('folderId')) {
            $query->where('storage_location_id', $request->folderId);
        }
        if ($request->filled('campana')) {
            $query->where('campana', 'like', '%' . $request->campana . '%');
        }

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

        $tempDir = storage_path('app/temp');
        if (!File::exists($tempDir)) File::makeDirectory($tempDir, 0755, true);

        $zipName = 'seleccion_' . date('Ymd_His') . '.zip';
        $zipPath = $tempDir . '/' . $zipName;

        $zip = new ZipArchive;
        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) === TRUE) {
            $filesAdded = 0;

            foreach ($recordings as $rec) {
                $realPath = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $rec->full_path ?? $rec->path);
                
                if (file_exists($realPath)) {
                    $zip->addFile($realPath, $rec->filename);
                    $filesAdded++;
                }
            }

            $zip->close();

            if ($filesAdded === 0) {
                return response()->json(['message' => 'Ninguno de los archivos seleccionados existe físicamente.'], 404);
            }

            // REGISTRO EN AUDITORÍA
            try {
                AuditLog::create([
                    'user_id' => Auth::id(), 
                    'action' => 'Descarga ZIP',
                    'details' => "Descarga masiva de $filesAdded grabaciones.",
                    'ip_address' => $request->ip()
                ]);
            } catch (\Exception $e) {
                Log::error("Error registrando auditoría ZIP: " . $e->getMessage());
            }

            return response()->download($zipPath)->deleteFileAfterSend(true);
        }

        return response()->json(['message' => 'Error al crear el archivo ZIP.'], 500);
    }
}