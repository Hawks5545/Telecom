<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            // Agregamos el índice a la columna de fecha
            $table->index('created_at');
        });
    }

    public function down()
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            // Si nos arrepentimos, esto lo quita
            $table->dropIndex(['created_at']);
        });
    }
};