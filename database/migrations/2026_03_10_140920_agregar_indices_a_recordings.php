<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('recordings', function (Blueprint $table) {
            // Este índice es el que le salvará la vida al Dashboard y a la Bandeja de Entrada
            $table->index('storage_location_id');
        });
    }

    public function down()
    {
        Schema::table('recordings', function (Blueprint $table) {
            $table->dropIndex(['storage_location_id']);
        });
    }
};
