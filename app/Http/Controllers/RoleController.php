<?php

namespace App\Http\Controllers;

use App\Models\Role;
use Illuminate\Http\Request;

class RoleController extends Controller
{
    // Listar todos los roles para la tabla
    public function index()
    {
        return response()->json(Role::all());
    }

    // Guardar un nuevo rol (Punto 1 de tu solicitud)
    public function store(Request $request)
    {
        $request->validate([
            'display_name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        // Generamos el 'name' técnico (slug) automáticamente
        $name = strtolower(str_replace(' ', '_', $request->display_name));

        $role = Role::create([
            'name' => $name,
            'display_name' => $request->display_name,
            'description' => $request->description,
        ]);

        return response()->json($role, 201);
    }
}