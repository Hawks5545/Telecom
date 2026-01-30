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
            $table->foreignId('storage_location_id')->constrained()->onDelete('cascade');
            $table->string('filename');
            $table->string('path');
            $table->bigInteger('size');
            $table->integer('duration')->nullable();
            $table->string('extension', 10);
            $table->string('cedula')->nullable()->index();
            $table->string('telefono')->nullable()->index();
            $table->string('campana')->nullable()->index();
            $table->dateTime('fecha_grabacion')->nullable()->index();
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
