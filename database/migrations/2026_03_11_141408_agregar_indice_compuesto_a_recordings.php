<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('recordings', function (Blueprint $table) {
            // El super-índice: Busca por carpeta y ya entrega los datos ordenados por fecha
            $table->index(['storage_location_id', 'fecha_grabacion'], 'idx_folder_date');
        });
    }

    public function down()
    {
        Schema::table('recordings', function (Blueprint $table) {
            $table->dropIndex('idx_folder_date');
        });
    }
};
