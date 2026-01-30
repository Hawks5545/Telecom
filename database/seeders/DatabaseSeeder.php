<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role; 
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
   
    public function run(): void
    {
        //  CREAR ROLES PRINCIPALES
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
        // CREAR USUARIO ADMINISTRADOR
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

        $this->call([
            UserSeeder::class,
        ]);

    }
}