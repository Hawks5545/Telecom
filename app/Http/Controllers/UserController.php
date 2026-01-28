<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role; 
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index()
    {
        // Cargamos también la relación 'assignedRole' para mostrarla en la tabla
        return response()->json(User::with('assignedRole')->orderBy('id', 'asc')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'cedula' => 'required|string|max:20|unique:users',
            'role' => 'required|exists:roles,name', 
        ], [
            'email.unique' => 'Este correo electrónico ya está registrado.',
            'cedula.unique' => 'Esta cédula ya está registrada en el sistema.',
            'role.exists' => 'El rol seleccionado no es válido.',
        ]);

        // Buscamos el ID del rol
        $roleModel = Role::where('name', $request->role)->first();

        $tempPassword = Str::random(20); 

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'cedula' => $request->cedula,
            
            // Guardamos AMBOS datos de rol
            'role' => $request->role,      
            'role_id' => $roleModel->id,   
            
            'password' => Hash::make($tempPassword),
            
            // --- ESTADO INICIAL: PENDIENTE ---
            'is_active' => true,           // Está habilitado para activarse...
            'email_verified_at' => null,   // ...pero es Pendiente hasta que verifique
        ]);

        // Enviamos el correo para que defina su contraseña y se active
        $token = Password::createToken($user);
        $user->sendPasswordResetNotification($token);

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

        // Buscamos el nuevo rol
        $roleModel = Role::where('name', $request->role)->first();

        // Verificamos si cambió el correo
        $emailChanged = $request->email !== $user->email;

        $user->name = $request->name;
        $user->cedula = $request->cedula;
        
        // Actualizamos roles
        $user->role = $request->role;      
        $user->role_id = $roleModel->id;   

        // Actualizamos estado de bloqueo (Activo/Inactivo)
        $user->is_active = $request->is_active;

        // Protección al Super Admin
        if ($user->id === 1 && $request->is_active == false) {
             return response()->json(['message' => 'No puedes desactivar al Super Admin.'], 403);
        }

        // --- LÓGICA DE RE-VERIFICACIÓN ---
        // Si cambió el correo, el usuario vuelve a ser PENDIENTE
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
            'user' => $user
        ]);
    }

    // Función para Eliminar Usuario
    public function destroy(Request $request, $id)
    {
        $user = User::findOrFail($id);

        // 1. PROTECCIÓN DE ORO: Jamás borrar al Super Admin (ID 1)
        if ($user->id === 1) {
            return response()->json([
                'message' => '¡Acción Denegada! No puedes eliminar al Super Administrador principal.'
            ], 403);
        }

        // 2. Evitar auto-eliminación
        if ($request->user()->id === $user->id) {
             return response()->json([
                'message' => 'No puedes eliminar tu propia cuenta mientras estás en sesión.'
            ], 400);
        }

        $user->delete();

        return response()->json(['message' => 'Usuario eliminado correctamente.']);
    }
}