<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role; // <--- Importante importar el modelo Role
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. CREAR ROLES PRIMORDIALES
        $roles = [
            [
                'name' => 'admin', 
                'display_name' => 'Administrador', 
                'description' => 'Acceso total al sistema y gestión de usuarios.'
            ],
            [
                'name' => 'senior', 
                'display_name' => 'Senior', 
                'description' => 'Acceso a gestión de carpetas, búsqueda e indexación.'
            ],
            [
                'name' => 'junior', 
                'display_name' => 'Junior', 
                'description' => 'Acceso a búsqueda e indexación de grabaciones.'
            ],
            [
                'name' => 'analista', 
                'display_name' => 'Analista', 
                'description' => 'Solo consulta y escucha de grabaciones.'
            ],
        ];

        foreach ($roles as $role) {
            Role::updateOrCreate(['name' => $role['name']], $role);
        }

        // 2. CREAR USUARIO ADMINISTRADOR
        // Usamos updateOrCreate para evitar errores si ejecutas el seeder varias veces
        User::updateOrCreate(
            ['email' => env('ADMIN_EMAIL', 'admin@ejemplo.com')],
            [
                'name' => 'Admin Telecom',
                'password' => Hash::make(env('ADMIN_PASSWORD', 'password')),
                'role' => 'admin',  
                'cedula' => null,   
                'is_active' => true 
            ]
        );
    }
}