<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User; 
use App\Models\AuditLog; 
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRules;
use Illuminate\Support\Facades\RateLimiter; 
use Illuminate\Support\Facades\Cache; // NUEVO: Para contar los strikes globales de la cuenta

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'login_id' => 'required|string',
            'password' => 'required',
        ]);

        // --- 🛡️ CAPA 1: RATE LIMITING (Bloqueo por IP) ---
        $throttleKey = Str::transliterate(Str::lower($request->login_id).'|'.$request->ip());
        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            return response()->json([
                'message' => "Demasiados intentos fallidos. Por seguridad, intenta de nuevo en {$seconds} segundos."
            ], 429);
        }

        $loginId = $request->login_id;
        $field = filter_var($loginId, FILTER_VALIDATE_EMAIL) ? 'email' : 'cedula';
        
        // Buscamos al usuario ANTES de validar la contraseña para saber a quién estamos atacando
        $user = User::where($field, $loginId)->first();

        // Si el usuario no existe, simulamos un fallo genérico (Anti-enumeración)
        if (!$user) {
            RateLimiter::hit($throttleKey);
            return response()->json(['message' => 'Credenciales incorrectas'], 401);
        }

        // --- 🛡️ CAPA 2: BLOQUEO PERMANENTE DE CUENTA (Strikes) ---
        $strikesKey = 'login_strikes_' . $user->id;
        
        if (!Hash::check($request->password, $user->password)) {
            RateLimiter::hit($throttleKey); // Sumamos fallo a la IP
            
            // Sumamos un "Strike" global a la cuenta (dura 24 horas en memoria)
            $strikes = Cache::increment($strikesKey);
            Cache::put($strikesKey, $strikes, now()->addHours(24));

            // Si llega a 10 fallos y NO es el Super Admin (ID 1)
            if ($strikes >= 10 && $user->id !== 1 && $user->is_active == 1) {
                $user->is_active = 0; // Lo bloqueamos
                $user->save();

                AuditLog::create([
                    'user_id' => $user->id,
                    'action' => 'Seguridad',
                    'details' => 'Cuenta bloqueada automáticamente por múltiples intentos fallidos de contraseña.',
                    'ip_address' => $request->ip()
                ]);
            }

            return response()->json(['message' => 'Credenciales incorrectas'], 401);
        }

        // --- SI LA CONTRASEÑA ES CORRECTA, LIMPIAMOS EL HISTORIAL ---
        RateLimiter::clear($throttleKey);
        Cache::forget($strikesKey); // Borramos los strikes

        // --- VALIDACIONES DE ESTADO ---
        if ($user->is_active == 0) {
            return response()->json([
                'message' => 'Tu usuario está bloqueado por seguridad. Contacta al administrador o utiliza la opción "Olvidé mi contraseña" para desbloquearla.'
            ], 403);
        }

        if ($user->email_verified_at === null) {
            return response()->json(['message' => 'Tu cuenta está pendiente. Por favor revisa tu correo para activarla.'], 403);
        }

        // --- CARGA DE ROLES ---
        $user->load('role'); 
        $rolInterno = $user->role ? $user->role->name : 'analista'; 
        $rolVisible = $user->role ? $user->role->display_name : 'Analista'; 
        $permisos = ($rolInterno === 'admin') ? ['*'] : ($user->role->permissions ?? []);

        // AUDITORÍA LOGIN 
        try {
            AuditLog::create([
                'user_id' => $user->id,
                'action' => 'Login',
                'details' => "Inicio de sesión exitoso ({$field})",
                'ip_address' => $request->ip()
            ]);
        } catch (\Exception $e) {}

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
    
    public function logout(Request $request) {
        try {
            $user = $request->user();
            if ($user) {
                AuditLog::create([
                    'user_id' => $user->id,
                    'action' => 'Logout',
                    'details' => "Cierre de sesión",
                    'ip_address' => $request->ip()
                ]);
            }
        } catch (\Exception $e) {}

        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Sesión cerrada correctamente']);
    }

    public function sendResetLink(Request $request)
    {
        $request->validate(['login_id' => 'required|string']);

        $loginId = $request->login_id;
        $field = filter_var($loginId, FILTER_VALIDATE_EMAIL) ? 'email' : 'cedula';
        
        $user = User::where($field, $loginId)->first();

        if ($user) {
            Password::sendResetLink(['email' => $user->email]);
        }

        return response()->json([
            'message' => 'Si los datos coinciden con un usuario de nuestro sistema, hemos enviado un enlace de recuperación al correo electrónico registrado.'
        ], 200);
    }

    public function resetPassword(Request $request)
    {
        // --- 🔒 CAPA 3: POLÍTICA ESTRICTA DE CONTRASEÑAS ---
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => [
                'required',
                'confirmed',
                // Exigimos 12 caracteres, mayúsculas, minúsculas, números y símbolos
                PasswordRules::min(12)->mixedCase()->numbers()->symbols()
            ],
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, string $password) {
                $user->forceFill([
                    'password' => Hash::make($password)
                ])->setRememberToken(Str::random(60));

                // Si la cuenta estaba pendiente o bloqueada, la reactivamos (Válvula de escape)
                $user->email_verified_at = $user->email_verified_at ?? now();
                $user->is_active = true; 
                
                $user->save();
                event(new PasswordReset($user));
                
                // Limpiamos los strikes de bloqueos pasados
                Cache::forget('login_strikes_' . $user->id);
            }
        );

        if ($status == Password::PASSWORD_RESET) {
            return response()->json(['message' => '¡Contraseña establecida! Tu cuenta ahora está ACTIVA y segura. Ya puedes iniciar sesión.']);
        }

        return response()->json(['message' => 'El token es inválido o ha expirado.'], 400);
    }
}