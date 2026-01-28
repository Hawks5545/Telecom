<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User; 
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRules;

class AuthController extends Controller
{
    // Función para Iniciar Sesión
    public function login(Request $request)
    {
        // 1. Validar que envíen los datos
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        // 2. Buscar el usuario por correo
        $user = User::where('email', $request->email)->first();

        // 3. Verificar contraseña y existencia
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Credenciales incorrectas'
            ], 401);
        }

        // --- NUEVA LÓGICA DE ESTADOS ---

        // 4. Verificar si está BLOQUEADO por el administrador (Inactivo)
        if ($user->is_active == 0) {
            return response()->json([
                'message' => 'Tu usuario está bloqueado por el administrador. Contacta a soporte.'
            ], 403);
        }

        // 5. Verificar si está PENDIENTE (No ha verificado correo/creado contraseña)
        if ($user->email_verified_at === null) {
            return response()->json([
                'message' => 'Tu cuenta está pendiente. Por favor revisa tu correo y crea tu contraseña para activarla.'
            ], 403);
        }

        // --- CARGA DE ROLES ---
        $user->load('assignedRole'); 

        $rolInterno = null; 
        $rolVisible = null; 
        $permisos = [];

        if ($user->assignedRole) {
            $rolInterno = $user->assignedRole->name;
            $rolVisible = $user->assignedRole->display_name; 

            // Permisos
            if ($rolInterno === 'admin') {
                $permisos = ['*'];
            } else {
                $permisos = $user->assignedRole->permissions ?? [];
            }
        }

        return response()->json([
            'message' => 'Bienvenido al sistema TeleCom',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $rolInterno,         
                'role_display' => $rolVisible, 
                'permissions' => $permisos,
            ],
            'token' => $user->createToken('auth_token')->plainTextToken
        ], 200);
    }
    
    // Función para Cerrar Sesion
    public function logout(Request $request) {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Sesión cerrada correctamente']);
    }

    // Enviar link de recuperación
    public function sendResetLink(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $status = \Illuminate\Support\Facades\Password::sendResetLink(
            $request->only('email')
        );

        if ($status === \Illuminate\Support\Facades\Password::RESET_LINK_SENT) {
            return response()->json(['message' => '¡Correo enviado! Revisa tu bandeja para activar o recuperar tu cuenta.']);
        }

        return response()->json(['message' => 'No pudimos enviar el correo. Verifica que el usuario exista.'], 400);
    }

    // Restablecer la contraseña (Y ACTIVAR CUENTA)
    public function resetPassword(Request $request)
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => [
                'required',
                'confirmed',
                PasswordRules::min(8)
                    ->letters()
                    ->mixedCase()
                    ->numbers()
                    ->symbols()
            ],
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, string $password) {
                $user->forceFill([
                    'password' => Hash::make($password)
                ])->setRememberToken(Str::random(60));

                // --- MAGIA: SI ERA PENDIENTE, AHORA ES ACTIVO ---
                if ($user->email_verified_at === null) {
                    $user->email_verified_at = now();
                }

                $user->save();

                event(new PasswordReset($user));
            }
        );

        if ($status == Password::PASSWORD_RESET) {
            return response()->json(['message' => '¡Contraseña establecida! Tu cuenta ahora está ACTIVA. Ya puedes iniciar sesión.']);
        }

        return response()->json(['message' => 'El token es inválido o ha expirado.'], 400);
    }
}