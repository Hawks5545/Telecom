<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\StorageLocation;
use App\Models\Setting;
use Illuminate\Support\Facades\Log;

class ConfigurationController extends Controller
{
    // =========================================================
    // 1. BANDEJAS DE ENTRADA (INBOX)
    // =========================================================
    public function getInboxLocations(Request $request) {
        return $this->getLocationsByType('inbox', $request);
    }

    public function addInboxLocation(Request $request) {
        return $this->addLocationByType('inbox', $request);
    }

    public function deleteInboxLocation($id) {
        return $this->deleteLocation($id);
    }

    public function toggleInboxLocation($id) {
        return $this->toggleLocation($id);
    }

    // =========================================================
    // 2. CARPETAS MADRE (CAMPAIGNS)
    // =========================================================
    public function getCampaignLocations(Request $request) {
        return $this->getLocationsByType('campaign', $request);
    }

    public function addCampaignLocation(Request $request) {
        return $this->addLocationByType('campaign', $request);
    }

    public function deleteCampaignLocation($id) {
        return $this->deleteLocation($id);
    }

    public function toggleCampaignLocation($id) {
        return $this->toggleLocation($id);
    }


    // =========================================================
    // LÓGICA CENTRALIZADA (Reutilizable para ambos tipos)
    // =========================================================

    private function getLocationsByType($type, Request $request)
    {
        $search = $request->input('search');

        // Optimización 1: Seleccionamos solo las columnas necesarias
        $query = StorageLocation::select('id', 'name', 'path', 'is_active', 'created_at', 'type', 'description')
                    ->where('type', $type)
                    ->orderBy('created_at', 'desc');

        // Optimización 2: Búsqueda indexable. Quitamos el LIKE en created_at.
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")      
                  ->orWhere('path', 'like', "%{$search}%");
            });
        }

        // Limitamos a 100 resultados para evitar que una base de datos grande sature la RAM y tire React.
        return response()->json($query->limit(100)->get());
    }

    private function addLocationByType($type, Request $request)
    {
        $request->validate([
            'name' => 'nullable|string|max:100',
            'path' => 'required|string|max:255|unique:storage_locations,path',
            'description' => 'nullable|string|max:255'
        ], [
            'path.required' => 'La ruta es obligatoria.',
            'path.unique' => "Esta ruta ya está registrada en el sistema."
        ]);

        try {
            // Limpieza de etiquetas HTML para evitar XSS en el nombre
            $safeName = strip_tags($request->name ?? 'Nueva Ubicación');
            
            $location = StorageLocation::create([
                'type' => $type, 
                'name' => $safeName,
                'path' => trim($request->path),
                'description' => strip_tags($request->description),
                'is_active' => true
            ]);

            return response()->json([
                'message' => 'Ubicación agregada correctamente.',
                'location' => $location
            ], 201);

        } catch (\Exception $e) {
            Log::error("Error agregando ruta: " . $e->getMessage());
            return response()->json(['message' => 'Error interno al guardar la ruta.'], 500);
        }
    }

    private function deleteLocation($id)
    {
        $location = StorageLocation::findOrFail($id);
        
        // Verificación de seguridad: No borrar si tiene archivos asociados
        if ($location->recordings()->count() > 0) {
            return response()->json([
                'message' => 'No puedes eliminar esta ruta porque tiene audios indexados.'
            ], 400);
        }

        $location->delete();
        return response()->json(['message' => 'Ubicación eliminada correctamente.']);
    }

    private function toggleLocation($id)
    {
        $location = StorageLocation::findOrFail($id);
        $location->is_active = !$location->is_active;
        $location->save();

        return response()->json([
            'message' => 'Estado actualizado.',
            'is_active' => $location->is_active
        ]);
    }

    // =========================================================
    // 3. PREFERENCIAS GLOBALES (SETTINGS)
    // =========================================================
    public function getSettings()
    {
        $settings = Setting::pluck('value', 'key');
        return response()->json($settings);
    }

    public function saveSettings(Request $request)
    {
        // 🛡️ LISTA BLANCA (Whitelist): Solo estas llaves pueden ser modificadas
        $allowedSettings = [
            'download_format',
            'hide_broken_links',
            'scan_frequency',
            'admin_email',
            'alert_disk_full',
            'alert_service_down'
        ];

        // Iteramos solo sobre las llaves enviadas que existan en nuestra lista blanca
        $inputs = $request->only($allowedSettings);

        foreach ($inputs as $key => $value) {
            // Evitamos guardar valores nulos accidentalmente que puedan romper el front
            if ($value !== null) {
                Setting::updateOrCreate(
                    ['key' => $key],
                    ['value' => strip_tags($value)] // Evitamos inyección HTML
                );
            }
        }

        return response()->json(['message' => 'Configuración actualizada de forma segura.']);
    }
}