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
use Carbon\Carbon;

class SearchController extends Controller
{
    public function getFolders()
    {
        return response()->json(StorageLocation::where('is_active', true)->select('id', 'path', 'name')->get());
    }

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

        if ($request->filled('dateFrom') && $request->filled('dateTo')) {
            $from = Carbon::parse($request->dateFrom)->startOfDay();
            $to = Carbon::parse($request->dateTo)->endOfDay();
            $query->whereBetween('fecha_grabacion', [$from, $to]);
        } else {
            if ($request->filled('dateFrom')) {
                $from = Carbon::parse($request->dateFrom)->startOfDay();
                $query->where('fecha_grabacion', '>=', $from);
            }
            if ($request->filled('dateTo')) {
                $to = Carbon::parse($request->dateTo)->endOfDay();
                $query->where('fecha_grabacion', '<=', $to);
            }
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

    // --- DESCARGA INDIVIDUAL (SIN CACHÉ) ---
    public function downloadItem(Request $request, $id)
    {
        $recording = Recording::findOrFail($id);
        $pathToUse = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $recording->full_path ?? $recording->path);

        if (!file_exists($pathToUse)) {
            return response()->json(['message' => 'Archivo no encontrado en disco.'], 404);
        }

        // AUDITORÍA
        try {
            $campana = $recording->campana ?: 'General';
            AuditLog::create([
                'user_id' => Auth::id(),
                'action' => 'Descarga',
                'details' => "Descarga individual: {$recording->filename}. Campaña: {$campana}",
                'ip_address' => $request->ip()
            ]);
        } catch (\Exception $e) { 
            Log::error("Audit Error: " . $e->getMessage());
        }

        // HEADERS ANTI-CACHÉ
        $headers = [
            'Cache-Control' => 'no-cache, no-store, must-revalidate, max-age=0',
            'Pragma' => 'no-cache',
            'Expires' => 'Sat, 01 Jan 2000 00:00:00 GMT',
        ];

        return response()->download($pathToUse, $recording->filename, $headers);
    }

    // --- DESCARGA ZIP (MEJORADA: CUENTA ARCHIVOS POR CAMPAÑA) ---
    public function downloadZip(Request $request)
    {
        $ids = $request->input('ids', []);
        if (empty($ids)) return response()->json(['message' => 'No se seleccionaron archivos.'], 400);

        $recordings = Recording::whereIn('id', $ids)->get();
        if ($recordings->isEmpty()) return response()->json(['message' => 'Archivos no encontrados.'], 404);

        // --- LÓGICA NUEVA: CONTAR POR CAMPAÑA ---
        // Agrupa por campaña y cuenta cuántos archivos hay de cada una
        // Resultado ej: "Tigo:3, Claro:2"
        $campaignCounts = $recordings->map(fn($r) => $r->campana ?: 'General')->countBy();
        $campaignString = $campaignCounts->map(fn($count, $name) => "$name:$count")->implode(', ');
        // ----------------------------------------

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

            if ($filesAdded === 0) return response()->json(['message' => 'Archivos físicos no existen.'], 404);

            try {
                // Guardamos el detalle con el formato especial {Nombre:Cantidad}
                AuditLog::create([
                    'user_id' => Auth::id(), 
                    'action' => 'Descarga ZIP',
                    'details' => "Descarga masiva de $filesAdded grabaciones. Campañas: {{$campaignString}}",
                    'ip_address' => $request->ip()
                ]);
            } catch (\Exception $e) { Log::error("Audit ZIP Error: " . $e->getMessage()); }

            $headers = [
                'Cache-Control' => 'no-cache, no-store, must-revalidate, max-age=0',
                'Pragma' => 'no-cache',
                'Expires' => 'Sat, 01 Jan 2000 00:00:00 GMT',
            ];

            return response()->download($zipPath, $zipName, $headers)->deleteFileAfterSend(true);
        }

        return response()->json(['message' => 'Error al crear ZIP.'], 500);
    }
}