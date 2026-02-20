<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role;
use App\Models\AuditLog; // NUEVO: Para guardar las auditorías
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Auth; // NUEVO: Para saber quién hace la acción
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index()
    {
        return response()->json(User::with('role')->orderBy('id', 'asc')->get());
    }

    public function store(Request $request)
    {
        // 1. Validaciones
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

        // 2. TRADUCCIÓN: Buscamos el ID del rol basado en el nombre
        $roleModel = Role::where('name', $request->role)->first();

        // Genera contraseña temporal aleatoria
        $tempPassword = Str::random(20); 

        // 3. Crear Usuario (SOLO con role_id)
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'cedula' => $request->cedula,
            'role_id' => $roleModel->id,   
            'password' => Hash::make($tempPassword),
            'is_active' => true,     
            'email_verified_at' => null,   
        ]);

        // 4. Enviar correo de activación
        $token = Password::createToken($user);
        $user->sendPasswordResetNotification($token);
        $user->load('role');

        // --- 🔒 AUDITORÍA: CREACIÓN DE USUARIO ---
        $this->auditAction(
            'Crear Usuario', 
            "Creó al usuario: {$user->name} con rol de {$request->role}.",
            $request,
            [
                'target_user_id' => $user->id,
                'target_user_name' => $user->name,
                'assigned_role' => $request->role
            ]
        );

        return response()->json([
            'message' => 'Usuario registrado. Se ha enviado el correo para activar la cuenta.',
            'user' => $user
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $user = User::with('role')->findOrFail($id); // Cargamos el rol viejo para la auditoría

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'cedula' => ['required', 'string', 'max:20', Rule::unique('users')->ignore($user->id)],
            'role' => 'required|exists:roles,name',
            'is_active' => 'boolean' 
        ]);

        // Buscamos el nuevo rol por nombre para obtener su ID
        $roleModel = Role::where('name', $request->role)->first();

        // --- PREPARAR DATOS PARA AUDITORÍA DE CAMBIOS ---
        $changes = [];
        if ($user->name !== $request->name) {
            $changes['old_name'] = $user->name;
            $changes['new_name'] = $request->name;
        }
        if ($user->email !== $request->email) {
            $changes['old_email'] = $user->email;
            $changes['new_email'] = $request->email;
        }
        if ($user->role->name !== $request->role) {
            $changes['old_role'] = $user->role->name;
            $changes['new_role'] = $request->role;
        }
        if ($user->is_active != $request->is_active) {
            $changes['old_status'] = $user->is_active ? 'Activo' : 'Inactivo';
            $changes['new_status'] = $request->is_active ? 'Activo' : 'Inactivo';
        }

        // Verificamos si cambió el correo
        $emailChanged = $request->email !== $user->email;

        // Asignación de datos
        $user->name = $request->name;
        $user->cedula = $request->cedula;
        $user->role_id = $roleModel->id;   
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
            $token = Password::createToken($user);
            $user->sendPasswordResetNotification($token);
            $message = 'Usuario actualizado. Al cambiar el correo, pasó a estado PENDIENTE hasta verificación.';
        }

        // --- 🔒 AUDITORÍA: ACTUALIZACIÓN DE USUARIO ---
        // Solo guardamos el log si realmente cambiaron algún dato
        if (!empty($changes)) {
            $actionTitle = isset($changes['old_role']) ? 'Cambiar Rol' : 'Actualizar Usuario';
            
            $this->auditAction(
                $actionTitle, 
                "Actualizó perfil del usuario: {$user->name}",
                $request,
                $changes // Pasamos el arreglo de cambios directo al JSON
            );
        }

        return response()->json([
            'message' => $message,
            'user' => $user->load('role') 
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

        $deletedName = $user->name;
        $deletedRole = $user->role->name ?? 'Sin Rol';
        
        $user->delete();

        // --- 🔒 AUDITORÍA: ELIMINACIÓN DE USUARIO ---
        $this->auditAction(
            'Eliminar Usuario', 
            "Eliminó permanentemente al usuario: {$deletedName} ({$deletedRole})",
            $request,
            ['deleted_user' => $deletedName]
        );

        return response()->json(['message' => 'Usuario eliminado correctamente.']);
    }

    // --- HELPER PRIVADO DE AUDITORÍA ---
    private function auditAction($action, $details, $request, $metadata = [])
    {
        try {
            AuditLog::create([
                'user_id' => Auth::id(), // Registra quién hizo la acción
                'action' => $action,
                'details' => $details,
                'metadata' => json_encode($metadata),
                'ip_address' => $request->ip()
            ]);
        } catch (\Exception $e) { 
            // Si falla la auditoría, no se rompe el proceso de guardado de usuario
            report($e); 
        }
    }
}