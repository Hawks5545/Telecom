<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
{
    Schema::create('recordings', function (Blueprint $table) {
        $table->id();
        // Indexamos la relación para que las gráficas vuelen
        $table->foreignId('storage_location_id')->constrained()->onDelete('cascade');
        
        $table->string('filename')->index(); 
        
        // RUTA FÍSICA REAL (Ej: D:/Storage/Claro/2025/audio.wav)
        // Usamos TEXT porque en Windows las rutas pueden exceder 255 caracteres
        $table->text('full_path'); 
        
        // RUTA RELATIVA (Ej: 2025/Enero/) - Útil para reconstruir ZIPs
        $table->string('folder_path')->nullable(); 

        // --- ¡COLUMNA 'PATH' ELIMINADA POR OPTIMIZACIÓN! ---
        
        $table->bigInteger('size');
        $table->integer('duration')->nullable();
        $table->string('extension', 10);
        
        // Metadatos clave indexados
        $table->string('cedula', 20)->nullable()->index();
        $table->string('telefono', 20)->nullable()->index();
        $table->string('campana', 50)->nullable()->index(); 
        
        $table->dateTime('fecha_grabacion')->nullable()->index();
        $table->dateTime('original_created_at')->nullable();
        
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('recordings');
    }
};
