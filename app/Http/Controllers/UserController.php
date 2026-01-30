<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role; 
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index()
    {
        // CAMBIO: Usamos la relación 'role' (definida en el modelo User) en lugar de 'assignedRole'
        return response()->json(User::with('role')->orderBy('id', 'asc')->get());
    }

    public function store(Request $request)
    {
        // 1. Validaciones
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'cedula' => 'required|string|max:20|unique:users',
            // El frontend envía el nombre (ej: 'admin'), validamos que exista en la tabla roles
            'role' => 'required|exists:roles,name', 
        ], [
            'email.unique' => 'Este correo electrónico ya está registrado.',
            'cedula.unique' => 'Esta cédula ya está registrada en el sistema.',
            'role.exists' => 'El rol seleccionado no es válido.',
        ]);

        // 2. TRADUCCIÓN: Buscamos el ID del rol basado en el nombre
        $roleModel = Role::where('name', $request->role)->first();

        // Generamos contraseña temporal aleatoria
        $tempPassword = Str::random(20); 

        // 3. Crear Usuario (SOLO con role_id)
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'cedula' => $request->cedula,
            
            // --- CAMBIO IMPORTANTE: NORMALIZACIÓN ---
            // Ya NO guardamos la columna 'role' (texto), solo el ID.
            'role_id' => $roleModel->id,   
            
            'password' => Hash::make($tempPassword),
            
            // Estado Inicial: Pendiente
            'is_active' => true,           // Habilitado...
            'email_verified_at' => null,   // ...pero pendiente de verificar
        ]);

        // 4. Enviar correo de activación
        $token = Password::createToken($user);
        $user->sendPasswordResetNotification($token);

        // Cargamos la relación para devolver el objeto completo al frontend
        $user->load('role');

        return response()->json([
            'message' => 'Usuario registrado. Se ha enviado el correo para activar la cuenta.',
            'user' => $user
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'cedula' => ['required', 'string', 'max:20', Rule::unique('users')->ignore($user->id)],
            'role' => 'required|exists:roles,name',
            'is_active' => 'boolean' 
        ]);

        // Buscamos el nuevo rol por nombre para obtener su ID
        $roleModel = Role::where('name', $request->role)->first();

        // Verificamos si cambió el correo
        $emailChanged = $request->email !== $user->email;

        // Asignación de datos
        $user->name = $request->name;
        $user->cedula = $request->cedula;
        
        // --- CAMBIO IMPORTANTE: Solo actualizamos el ID ---
        $user->role_id = $roleModel->id;   
        // $user->role = $request->role; <--- ELIMINADO
        
        $user->is_active = $request->is_active;

        // Protección al Super Admin (ID 1)
        if ($user->id === 1 && $request->is_active == false) {
             return response()->json(['message' => 'No puedes desactivar al Super Admin.'], 403);
        }

        // Lógica de Re-verificación de correo
        if ($emailChanged) {
            $user->email = $request->email;
            $user->email_verified_at = null; 
        }

        $user->save();

        $message = 'Usuario actualizado correctamente.';
        
        if ($emailChanged) {
            // Si cambió correo, enviamos nuevo link de activación
            $token = Password::createToken($user);
            $user->sendPasswordResetNotification($token);
            $message = 'Usuario actualizado. Al cambiar el correo, pasó a estado PENDIENTE hasta verificación.';
        }

        return response()->json([
            'message' => $message,
            'user' => $user->load('role') // Devolvemos con el rol cargado
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $user = User::findOrFail($id);

        // 1. Protección Super Admin
        if ($user->id === 1) {
            return response()->json([
                'message' => '¡Acción Denegada! No puedes eliminar al Super Administrador principal.'
            ], 403);
        }

        // 2. Protección Auto-eliminación
        if ($request->user()->id === $user->id) {
             return response()->json([
                'message' => 'No puedes eliminar tu propia cuenta mientras estás en sesión.'
            ], 400);
        }

        $user->delete();

        return response()->json(['message' => 'Usuario eliminado correctamente.']);
    }
}