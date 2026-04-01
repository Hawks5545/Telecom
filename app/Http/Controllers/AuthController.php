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
use Illuminate\Support\Facades\Cache;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'login_id' => 'required|string',
            'password' => 'required',
        ]);

        // --- CAPA 1: RATE LIMITING ---
        $throttleKey = Str::transliterate(Str::lower($request->login_id).'|'.$request->ip());
        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            return response()->json([
                'message' => "Demasiados intentos fallidos. Por seguridad, intenta de nuevo en {$seconds} segundos."
            ], 429);
        }

        $loginId = $request->login_id;
        $field   = filter_var($loginId, FILTER_VALIDATE_EMAIL) ? 'email' : 'cedula';
        $user    = User::where($field, $loginId)->first();

        if (!$user) {
            RateLimiter::hit($throttleKey);
            return response()->json(['message' => 'Credenciales incorrectas'], 401);
        }

        // --- CAPA 2: BLOQUEO PERMANENTE DE CUENTA ---
        $strikesKey = 'login_strikes_' . $user->id;

        if (!Hash::check($request->password, $user->password)) {
            RateLimiter::hit($throttleKey);

            $strikes = Cache::increment($strikesKey);
            Cache::put($strikesKey, $strikes, now()->addHours(24));

            if ($strikes >= 10 && $user->id !== 1 && $user->is_active == 1) {
                $user->is_active = 0;
                $user->save();

                AuditLog::create([
                    'user_id'    => $user->id,
                    'action'     => 'Seguridad',
                    'details'    => 'Cuenta bloqueada automáticamente por múltiples intentos fallidos de contraseña.',
                    'ip_address' => $request->ip()
                ]);
            }

            return response()->json(['message' => 'Credenciales incorrectas'], 401);
        }

        // --- CONTRASEÑA CORRECTA — LIMPIAR HISTORIAL ---
        RateLimiter::clear($throttleKey);
        Cache::forget($strikesKey);

        // --- VALIDACIONES DE ESTADO ---
        if ($user->is_active == 0) {
            return response()->json([
                'message' => 'Tu usuario está bloqueado por seguridad. Contacta al administrador o utiliza la opción "Olvidé mi contraseña" para desbloquearla.'
            ], 403);
        }

        if ($user->email_verified_at === null) {
            return response()->json([
                'message' => 'Tu cuenta está pendiente. Por favor revisa tu correo para activarla.'
            ], 403);
        }

        // --- CARGA DE ROLES Y PERMISOS ---
        $user->load('role');
        $rolInterno = $user->role ? $user->role->name         : 'analista';
        $rolVisible = $user->role ? $user->role->display_name : 'Analista';
        $permisos   = ($rolInterno === 'admin') ? ['*'] : ($user->role->permissions ?? []);

        // AUDITORÍA LOGIN
        try {
            AuditLog::create([
                'user_id'    => $user->id,
                'action'     => 'Login',
                'details'    => "Inicio de sesión exitoso ({$field})",
                'ip_address' => $request->ip()
            ]);
        } catch (\Exception $e) {}

        return response()->json([
            'message'              => 'Bienvenido al sistema TeleCom',
            'must_change_password' => (bool) $user->must_change_password, // ← NUEVO
            'user' => [
                'id'           => $user->id,
                'name'         => $user->name,
                'email'        => $user->email,
                'role'         => $rolInterno,
                'role_display' => $rolVisible,
                'permissions'  => $permisos,
            ],
            'token' => $user->createToken('auth_token')->plainTextToken
        ], 200);
    }

    public function logout(Request $request)
    {
        try {
            $user = $request->user();
            if ($user) {
                AuditLog::create([
                    'user_id'    => $user->id,
                    'action'     => 'Logout',
                    'details'    => "Cierre de sesión",
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
        $field   = filter_var($loginId, FILTER_VALIDATE_EMAIL) ? 'email' : 'cedula';
        $user    = User::where($field, $loginId)->first();

        if ($user) {
            Password::sendResetLink(['email' => $user->email]);
        }

        return response()->json([
            'message' => 'Si los datos coinciden con un usuario de nuestro sistema, hemos enviado un enlace de recuperación al correo electrónico registrado.'
        ], 200);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'token'    => 'required',
            'email'    => 'required|email',
            'password' => [
                'required',
                'confirmed',
                PasswordRules::min(12)->mixedCase()->numbers()->symbols()
            ],
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, string $password) {
                $user->forceFill([
                    'password' => Hash::make($password)
                ])->setRememberToken(Str::random(60));

                $user->email_verified_at    = $user->email_verified_at ?? now();
                $user->is_active            = true;
                $user->must_change_password = false; // ← NUEVO: limpiar flag si usó el correo
                $user->save();

                event(new PasswordReset($user));
                Cache::forget('login_strikes_' . $user->id);
            }
        );

        if ($status == Password::PASSWORD_RESET) {
            return response()->json([
                'message' => '¡Contraseña establecida! Tu cuenta ahora está ACTIVA y segura. Ya puedes iniciar sesión.'
            ]);
        }

        return response()->json(['message' => 'El token es inválido o ha expirado.'], 400);
    }

    // --- CAMBIO DE CONTRASEÑA OBLIGATORIO (Primer Login) ---
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'password'         => [
                'required',
                'confirmed',
                'different:current_password',
                PasswordRules::min(12)->mixedCase()->numbers()->symbols()
            ],
        ], [
            'password.different' => 'La nueva contraseña debe ser diferente a la actual.',
            'password.min'       => 'La contraseña debe tener al menos 12 caracteres.',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'La contraseña actual es incorrecta.'
            ], 422);
        }

        $user->password             = Hash::make($request->password);
        $user->must_change_password = false;
        $user->save();

        try {
            AuditLog::create([
                'user_id'    => $user->id,
                'action'     => 'Cambio de Contraseña',
                'details'    => 'El usuario cambió su contraseña temporal por una nueva.',
                'ip_address' => $request->ip()
            ]);
        } catch (\Exception $e) {}

        return response()->json([
            'message' => '¡Contraseña actualizada exitosamente!'
        ]);
    }
}
