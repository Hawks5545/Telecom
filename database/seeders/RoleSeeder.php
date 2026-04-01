<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use Illuminate\Support\Facades\DB;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        // 1. ADMIN - FORZAR MINÚSCULA
        $admin = Role::updateOrCreate(['id' => 1], [
            'name' => 'admin',
            'display_name' => 'Administrador',
            'description' => 'Control total del sistema',
            'permissions' => [
                '*', 
                'Dashboard', 
                'Búsqueda de Grabaciones', 
                'Gestor de Carpetas', 
                'Indexación', 
                'Auditorías', 
                'Reportes',
                'Gestión de Usuarios'
            ],
        ]);

    
        DB::table('roles')->where('id', 1)->update(['name' => 'admin']);


        // 2. RESTO DE ROLES...
        Role::updateOrCreate(['name' => 'senior'], [
            'display_name' => 'Desarrollador Senior', 
            'description' => 'Acceso avanzado',
            'permissions' => ['Dashboard', 'Búsqueda de Grabaciones', 'Gestor de Carpetas', 'Indexación', 'Auditorías', 'Reportes']
        ]);

        Role::updateOrCreate(['name' => 'junior'], [
            'display_name' => 'Desarrollador Junior',
            'description' => 'Operativo básico',
            'permissions' => ['Dashboard', 'Búsqueda de Grabaciones', 'Gestor de Carpetas']
        ]);

        Role::updateOrCreate(['name' => 'analista'], [
            'display_name' => 'Analista de Calidad',
            'description' => 'Solo consulta',
            'permissions' => ['Dashboard', 'Búsqueda de Grabaciones']
        ]);

        Role::updateOrCreate(['name' => 'practicante_sena'], [
            'display_name' => 'Practicante SENA',
            'description' => 'Apoyo en escucha',
            'permissions' => ['Dashboard', 'Búsqueda de Grabaciones']
        ]);
    }
}