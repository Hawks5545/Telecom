<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    // Función para registrar un nuevo usuario (Solo Admin)
    public function store(Request $request)
    {
        // 1. VALIDACIÓN ROBUSTA (Tu Punto #1)
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users', // Correo único
            'cedula' => 'required|string|max:20|unique:users',      // Cédula única
            'role' => 'required|in:admin,senior,junior,analista',     // Roles permitidos
        ], [
            // Mensajes personalizados
            'email.unique' => 'Este correo electrónico ya está registrado.',
            'cedula.unique' => 'Esta cédula ya está registrada en el sistema.',
        ]);

        // 2. CREACIÓN DEL USUARIO
        // Generamos una contraseña aleatoria imposible de adivinar (porque el usuario la va a cambiar ya mismo)
        $tempPassword = Str::random(20); 

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'cedula' => $request->cedula,
            'role' => $request->role,
            'password' => Hash::make($tempPassword),
            'is_active' => true,
        ]);

        // 3. ENVÍO DE CORREO (Tu Punto #2)
        // Usamos la misma función de "Olvidé mi contraseña" para enviarle el link de bienvenida
        $token = Password::createToken($user);
        
        // Aquí forzamos el envío del correo de reset
        $user->sendPasswordResetNotification($token);

        return response()->json([
            'message' => 'Usuario registrado correctamente. Se ha enviado un correo para establecer la contraseña.',
            'user' => $user
        ], 201);
    }

    // Obtener lista de usuarios
    public function index()
    {
        // Traemos todos (menos la contraseña para seguridad)
        $users = User::select('id', 'name', 'email', 'cedula', 'role', 'is_active', 'created_at')
                     ->orderBy('created_at', 'desc') // Los más nuevos primero
                     ->get();

        return response()->json($users);
    }
}