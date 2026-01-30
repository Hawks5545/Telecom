<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\StorageLocation;
use App\Models\Setting;

class ConfigurationController extends Controller
{
    // --- 1. SECCIÓN: GESTIÓN DE RUTAS (STORAGE LOCATIONS) ---

    // Obtener todas las rutas configuradas
    public function getStorageLocations()
    {
        $locations = StorageLocation::orderBy('created_at', 'desc')->get();
        return response()->json($locations);
    }

    // Agregar una nueva ruta
    public function addStorageLocation(Request $request)
    {
        $request->validate([
            'name' => 'nullable|string|max:100',
            'path' => 'required|string|unique:storage_locations,path',
            'description' => 'nullable|string|max:255'
        ], [
            'path.required' => 'La ruta es obligatoria.',
            'path.unique' => 'Esta ruta ya está registrada en el sistema.'
        ]);

        $location = StorageLocation::create([
            'name' => $request->name ?? 'Nueva Ubicación',
            'path' => $request->path,
            'description' => $request->description,
            'is_active' => true
        ]);

        return response()->json([
            'message' => 'Ubicación agregada correctamente.',
            'location' => $location
        ], 201);
    }

    // Eliminar una ruta
    public function deleteStorageLocation($id)
    {
        $location = StorageLocation::findOrFail($id);
        $location->delete();

        return response()->json(['message' => 'Ubicación eliminada correctamente.']);
    }

    // Activar / Desactivar ruta
    public function toggleStorageLocation($id)
    {
        $location = StorageLocation::findOrFail($id);
        $location->is_active = !$location->is_active;
        $location->save();

        return response()->json([
            'message' => 'Estado actualizado.',
            'is_active' => $location->is_active
        ]);
    }

    public function getSettings()
    {
        // Devuelve un objeto simple: { "download_format": "mp3", "scan_freq": "30" }
        $settings = Setting::pluck('value', 'key');
        return response()->json($settings);
    }

    public function saveSettings(Request $request)
    {
        // Recorre todo lo que envíe el frontend y lo guarda/actualiza
        foreach ($request->all() as $key => $value) {
            Setting::updateOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }

        return response()->json(['message' => 'Configuración actualizada correctamente.']);
    }
}