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
            'permisos' => 'array' // Validamos que llegue un array
        ]);

        // Generamos el slug interno (ej: "Operador Nocturno" -> "operador_nocturno")
        $name = strtolower(str_replace(' ', '_', $request->display_name));

        $role = Role::create([
            'name' => $name,
            'display_name' => $request->display_name,
            'description' => $request->description,
            // Guardamos el array de permisos que viene del React
            'permissions' => $request->permisos ?? [] 
        ]);

        return response()->json($role, 201);
    }

    // --- FUNCIÓN DE EDICIÓN ---
    public function update(Request $request, $id)
    {
        $role = Role::findOrFail($id);

        // PROTECCIÓN: No permitimos editar el nombre técnico ni permisos del 'admin' principal
        // para evitar que el sistema se quede sin superusuario.
        if ($role->name === 'admin') {
            // Al admin solo le dejamos cambiar la descripción visual, nada más.
            $role->update([
                'description' => $request->description
            ]);
            return response()->json(['message' => 'Rol Admin actualizado (Permisos protegidos).', 'role' => $role]);
        }

        $request->validate([
            'display_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'permisos' => 'array'
        ]);

        // Actualizamos todo
        $role->update([
            'display_name' => $request->display_name,
            'description' => $request->description,
            'permissions' => $request->permisos // Actualización dinámica de permisos
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
        // Esto evita dejar usuarios "huerfanos" sin permisos.
        if ($role->users()->count() > 0) {
            return response()->json([
                'message' => 'No puedes eliminar este rol porque hay usuarios asignados a él. Primero cambia el rol de esos usuarios.'
            ], 400);
        }

        // Borramos también los permisos asociados en la tabla pivote (si usas una)
        // O simplemente borramos el rol
        $role->delete();

        return response()->json(['message' => 'Rol eliminado correctamente.']);
    }
}