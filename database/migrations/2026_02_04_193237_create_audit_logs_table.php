<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null'); // Si se borra el usuario, queda el log
            $table->string('action'); // Ej: "Descarga", "Login"
            $table->text('details')->nullable(); // Ej: "Archivo X descargado"
            $table->string('ip_address')->nullable();
            $table->timestamps(); // Fecha y hora automática
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};