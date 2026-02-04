<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\StorageLocation;
use App\Models\Setting;

class ConfigurationController extends Controller
{
    // --- 1. SECCIÓN: GESTIÓN DE RUTAS (STORAGE LOCATIONS) ---

    // Obtener todas las rutas configuradas (CON BUSCADOR)
    public function getStorageLocations(Request $request)
    {
        $search = $request->input('search');

        // Se inicia la consulta ordenando por fecha
        $query = StorageLocation::orderBy('created_at', 'desc');

        // Si hay búsqueda, filtra
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")       
                  ->orWhere('path', 'like', "%{$search}%")     
                  ->orWhere('created_at', 'like', "%{$search}%"); 
            });
        }

        $locations = $query->get();
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
        $settings = Setting::pluck('value', 'key');
        return response()->json($settings);
    }

    public function saveSettings(Request $request)
    {
        foreach ($request->all() as $key => $value) {
            Setting::updateOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }

        return response()->json(['message' => 'Configuración actualizada correctamente.']);
    }
}