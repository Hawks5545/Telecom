<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Cédula: Única y obligatoria
            $table->string('cedula', 20)->unique()->after('email')->nullable(); 
            
            // Rol: Por defecto será 'analista' (el de menos permisos)
            // Opciones: 'admin', 'senior', 'junior', 'analista'
            $table->string('role')->default('analista')->after('cedula');
            
            // Estado: Para poder "bloquear" usuarios sin borrarlos
            $table->boolean('is_active')->default(true)->after('role');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['cedula', 'role', 'is_active']);
        });
    }
};