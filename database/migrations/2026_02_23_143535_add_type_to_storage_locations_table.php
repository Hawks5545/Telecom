<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
   public function up()
{
    Schema::table('storage_locations', function (Blueprint $table) {
        // Agregamos la columna 'type', por defecto será 'inbox' para no dañar datos viejos
        $table->string('type', 50)->default('inbox')->after('id');
    });
}

public function down()
{
    Schema::table('storage_locations', function (Blueprint $table) {
        $table->dropColumn('type');
    });
}
};
