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
        Schema::table('recordings', function (Blueprint $table) {
            // 1. Ruta absoluta real (C:/laragon/...) para que PHP encuentre el archivo
            $table->text('full_path')->nullable()->after('path');

            // 2. Ruta relativa de la carpeta (ej: "2023/Enero") para armar el ZIP
            $table->text('folder_path')->nullable()->after('full_path');

            // 3. Fecha real del archivo (filemtime) para mostrar la verdad
            $table->dateTime('original_created_at')->nullable()->after('fecha_grabacion');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('recordings', function (Blueprint $table) {
            $table->dropColumn(['full_path', 'folder_path', 'original_created_at']);
        });
    }
};