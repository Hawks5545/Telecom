<?php

namespace App\Http\Controllers;

use App\Models\Role;
use Illuminate\Http\Request;

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

        return response()->json($role, 201);
    }

    //  FUNCIÓN DE EDICIÓN 
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

        // Actualizamos todo normal para roles como Junior, Senior, etc.
        $role->update([
            'display_name' => $request->display_name,
            'description' => $request->description,
            'permissions' => $request->permisos
        ]);

        return response()->json(['message' => 'Rol actualizado correctamente', 'role' => $role]);
    }

    public function destroy($id)
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

        $role->delete();

        return response()->json(['message' => 'Rol eliminado correctamente.']);
    }
}