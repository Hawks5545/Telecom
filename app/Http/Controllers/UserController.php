<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Auth;
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
        $request->validate([
            'name'   => 'required|string|max:255',
            'email'  => 'required|string|email|max:255|unique:users',
            'cedula' => 'required|string|max:20|unique:users',
            'role'   => 'required|exists:roles,name',
        ], [
            'email.unique'  => 'Este correo electrónico ya está registrado.',
            'cedula.unique' => 'Esta cédula ya está registrada en el sistema.',
            'role.exists'   => 'El rol seleccionado no es válido.',
        ]);

        $roleModel = Role::where('name', $request->role)->first();

        // Generar contraseña temporal legible y segura
        // Formato: 3 letras mayúsculas + 3 números + 3 letras minúsculas + 2 símbolos
        $tempPassword = $this->generateTempPassword();

        $user = User::create([
            'name'                 => $request->name,
            'email'                => $request->email,
            'cedula'               => $request->cedula,
            'role_id'              => $roleModel->id,
            'password'             => Hash::make($tempPassword),
            'is_active'            => true,
            'email_verified_at'    => now(), // ← Activo de inmediato, sin esperar correo
            'must_change_password' => true,  // ← Debe cambiar al primer login
        ]);

        $user->load('role');

        $this->auditAction(
            'Crear Usuario',
            "Creó al usuario: {$user->name} con rol de {$request->role}.",
            $request,
            [
                'target_user_id'   => $user->id,
                'target_user_name' => $user->name,
                'assigned_role'    => $request->role
            ]
        );

        return response()->json([
            'message'       => 'Usuario registrado exitosamente.',
            'user'          => $user,
            'temp_password' => $tempPassword, // ← Solo se muestra una vez al admin
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $user = User::with('role')->findOrFail($id);

        $request->validate([
            'name'      => 'required|string|max:255',
            'email'     => ['required', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'cedula'    => ['required', 'string', 'max:20', Rule::unique('users')->ignore($user->id)],
            'role'      => 'required|exists:roles,name',
            'is_active' => 'boolean'
        ]);

        $roleModel   = Role::where('name', $request->role)->first();
        $changes     = [];
        $emailChanged = $request->email !== $user->email;

        if ($user->name !== $request->name) {
            $changes['old_name'] = $user->name;
            $changes['new_name'] = $request->name;
        }
        if ($emailChanged) {
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

        if ($user->id === 1 && $request->is_active == false) {
            return response()->json(['message' => 'No puedes desactivar al Super Admin.'], 403);
        }

        $user->name      = $request->name;
        $user->cedula    = $request->cedula;
        $user->role_id   = $roleModel->id;
        $user->is_active = $request->is_active;

        if ($emailChanged) {
            $user->email              = $request->email;
            $user->email_verified_at  = null;
        }

        $user->save();

        $message = 'Usuario actualizado correctamente.';

        if ($emailChanged) {
            $token   = Password::createToken($user);
            $user->sendPasswordResetNotification($token);
            $message = 'Usuario actualizado. Al cambiar el correo, pasó a estado PENDIENTE hasta verificación.';
        }

        if (!empty($changes)) {
            $actionTitle = isset($changes['old_role']) ? 'Cambiar Rol' : 'Actualizar Usuario';
            $this->auditAction($actionTitle, "Actualizó perfil del usuario: {$user->name}", $request, $changes);
        }

        return response()->json([
            'message' => $message,
            'user'    => $user->load('role')
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $user = User::findOrFail($id);

        if ($user->id === 1) {
            return response()->json([
                'message' => '¡Acción Denegada! No puedes eliminar al Super Administrador principal.'
            ], 403);
        }

        if ($request->user()->id === $user->id) {
            return response()->json([
                'message' => 'No puedes eliminar tu propia cuenta mientras estás en sesión.'
            ], 400);
        }

        $deletedName = $user->name;
        $deletedRole = $user->role->name ?? 'Sin Rol';

        $user->delete();

        $this->auditAction(
            'Eliminar Usuario',
            "Eliminó permanentemente al usuario: {$deletedName} ({$deletedRole})",
            $request,
            ['deleted_user' => $deletedName]
        );

        return response()->json(['message' => 'Usuario eliminado correctamente.']);
    }

    // --- GENERADOR DE CONTRASEÑA TEMPORAL SEGURA Y LEGIBLE ---
    private function generateTempPassword(): string
    {
        $mayusculas = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // sin I y O para evitar confusión
        $minusculas = 'abcdefghjkmnpqrstuvwxyz';  // sin i, l, o
        $numeros    = '23456789';                  // sin 0 y 1 para evitar confusión
        $simbolos   = '@#$%&*!';

        $password  = '';
        $password .= $mayusculas[random_int(0, strlen($mayusculas) - 1)];
        $password .= $mayusculas[random_int(0, strlen($mayusculas) - 1)];
        $password .= $mayusculas[random_int(0, strlen($mayusculas) - 1)];
        $password .= $numeros[random_int(0, strlen($numeros) - 1)];
        $password .= $numeros[random_int(0, strlen($numeros) - 1)];
        $password .= $numeros[random_int(0, strlen($numeros) - 1)];
        $password .= $minusculas[random_int(0, strlen($minusculas) - 1)];
        $password .= $minusculas[random_int(0, strlen($minusculas) - 1)];
        $password .= $minusculas[random_int(0, strlen($minusculas) - 1)];
        $password .= $simbolos[random_int(0, strlen($simbolos) - 1)];
        $password .= $simbolos[random_int(0, strlen($simbolos) - 1)];

        // Mezclar para que no sea predecible el orden
        return str_shuffle($password);
    }

    private function auditAction($action, $details, $request, $metadata = [])
    {
        try {
            AuditLog::create([
                'user_id'    => Auth::id(),
                'action'     => $action,
                'details'    => $details,
                'metadata'   => json_encode($metadata),
                'ip_address' => $request->ip()
            ]);
        } catch (\Exception $e) {
            report($e);
        }
    }
}
