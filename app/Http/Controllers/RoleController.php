<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\AuditLog; // NUEVO: Para la auditoría
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth; // NUEVO: Para saber quién hace la acción

class RoleController extends Controller
{
    public function index()
    {
        return response()->json(Role::all());
    }

    public function store(Request $request)
    {
        $request->validate([
            'display_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'permisos' => 'array' 
        ]);

        $name = strtolower(str_replace(' ', '_', $request->display_name));

        $role = Role::create([
            'name' => $name,
            'display_name' => $request->display_name,
            'description' => $request->description,
            'permissions' => $request->permisos ?? [] 
        ]);

        // --- 🔒 AUDITORÍA: CREAR ROL ---
        $this->auditAction(
            'Configuracion', 
            "Creó el rol de sistema: {$role->display_name}",
            $request,
            ['action_type' => 'Crear Rol', 'role_name' => $role->display_name]
        );

        return response()->json($role, 201);
    }

    public function update(Request $request, $id)
    {
        $role = Role::findOrFail($id);

        // Si el usuario es admin no se modifica nada 
        if (strtolower($role->name) === 'admin') {
            return response()->json([
                'message' => '🚫 ACCIÓN DENEGADA: El rol de Administrador Principal está protegido y no puede ser modificado.'
            ], 403);
        }

        // VALIDACIÓN NORMAL PARA OTROS ROLES 
        $request->validate([
            'display_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'permisos' => 'array'
        ]);

        // --- PREPARAR DATOS PARA AUDITORÍA ---
        $changes = ['action_type' => 'Editar Rol'];
        if ($role->display_name !== $request->display_name) {
            $changes['old_name'] = $role->display_name;
            $changes['new_name'] = $request->display_name;
        }
        
        // Verificamos si los permisos cambiaron (comparando los JSON)
        $oldPermissions = json_encode($role->permissions ?? []);
        $newPermissions = json_encode($request->permisos ?? []);
        if ($oldPermissions !== $newPermissions) {
            $changes['permisos'] = 'Se actualizaron los permisos de acceso';
        }

        // Actualizamos todo normal
        $role->update([
            'display_name' => $request->display_name,
            'description' => $request->description,
            'permissions' => $request->permisos
        ]);

        // --- 🔒 AUDITORÍA: ACTUALIZAR ROL ---
        // Solo guardamos si realmente modificaron algo
        if (count($changes) > 1) {
            $this->auditAction(
                'Configuracion', 
                "Actualizó la configuración del rol: {$role->display_name}",
                $request,
                $changes
            );
        }

        return response()->json(['message' => 'Rol actualizado correctamente', 'role' => $role]);
    }

    // NUEVO: Agregamos "Request $request" para poder leer la IP en la auditoría
    public function destroy(Request $request, $id)
    {
        $role = Role::findOrFail($id);

        // 1. PROTECCIÓN: No borrar el rol 'admin'
        if ($role->name === 'admin') {
            return response()->json(['message' => 'El rol de Administrador es vital y no se puede eliminar.'], 403);
        }

        // 2. SEGURIDAD: No borrar un rol si hay usuarios usándolo
        if ($role->users()->count() > 0) {
            return response()->json([
                'message' => 'No puedes eliminar este rol porque hay usuarios asignados a él. Primero cambia el rol de esos usuarios.'
            ], 400);
        }

        $deletedRoleName = $role->display_name;
        
        $role->delete();

        // --- 🔒 AUDITORÍA: ELIMINAR ROL ---
        $this->auditAction(
            'Configuracion', 
            "Eliminó el rol de sistema: {$deletedRoleName}",
            $request,
            ['action_type' => 'Eliminar Rol', 'deleted_role' => $deletedRoleName]
        );

        return response()->json(['message' => 'Rol eliminado correctamente.']);
    }

    // --- HELPER PRIVADO DE AUDITORÍA ---
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