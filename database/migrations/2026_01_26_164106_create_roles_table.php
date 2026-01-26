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
    Schema::create('roles', function (Blueprint $class) {
        $class->id();
        $class->string('name')->unique(); // 'admin', 'senior', 'junior', 'analista'
        $class->string('display_name');  // 'Administrador', 'Senior', etc.
        $class->string('description')->nullable();
        $class->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('roles');
    }
};
