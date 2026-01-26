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

        // 4. (Opcional) Verificar si tiene un Token anterior y borrarlo o crear uno nuevo
        // Por ahora, retornamos éxito simple para probar la conexión
        return response()->json([
            'message' => 'Bienvenido al sistema TeleCom',
            'user' => $user,
            'token' => $user->createToken('auth_token')->plainTextToken
        ], 200);
    }
    
    // Función para Cerrar Sesión (Logout)
    public function logout(Request $request) {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Sesión cerrada correctamente']);
    }

    // Enviar link de recuperación
    public function sendResetLink(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        // Laravel intenta enviar el correo automáticamente
        $status = \Illuminate\Support\Facades\Password::sendResetLink(
            $request->only('email')
        );

        if ($status === \Illuminate\Support\Facades\Password::RESET_LINK_SENT) {
            return response()->json(['message' => '¡Correo de recuperación enviado! Revisa tu bandeja.']);
        }

        return response()->json(['message' => 'No pudimos enviar el correo. Verifica que el usuario exista.'], 400);
    }


    // Restablecer la contraseña
    public function resetPassword(Request $request)
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => [
                'required',
                'confirmed',
                // AQUI USAMOS EL APODO:
                PasswordRules::min(8) // <--- Cambio aquí
                    ->letters()
                    ->mixedCase()
                    ->numbers()
                    ->symbols()
            ],
        ]);

        // Laravel verifica automáticamente el token y el email
        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, string $password) {
                $user->forceFill([
                    'password' => Hash::make($password) // Encriptamos la nueva contraseña
                ])->setRememberToken(Str::random(60));

                $user->save();

                event(new PasswordReset($user));
            }
        );

        if ($status == Password::PASSWORD_RESET) {
            return response()->json(['message' => '¡Tu contraseña ha sido restablecida! Ya puedes iniciar sesión.']);
        }

        return response()->json(['message' => 'El token es inválido o ha expirado.'], 400);
    }

    


}
