<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Role;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $adminRole = Role::firstOrCreate(['id' => 1], [
            'name' => 'admin',
            'display_name' => 'Administrador',
            'permissions' => ['*']
        ]);

        User::updateOrCreate(
            ['email' => 'carlosaad75@gmail.com'], 
            [
                'name' => 'Carlos Admin',
                'password' => Hash::make('12345678'),
                'role_id' => $adminRole->id, 
                'is_active' => true,
            ]
        );
    }
}