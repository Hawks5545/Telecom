<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute; // Importamos esto para la nueva sintaxis

class StorageLocation extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'path',
        'description',
        'is_active'
    ];

    // --- 1. NORMALIZACIÓN DE RUTAS (Moderno) ---
    // Reemplaza tu antigua función setPathAttribute.
    // Esto hace dos cosas automáticas al guardar:
    // 1. Cambia '\' por '/' (Para que Linux no se queje).
    // 2. Asegura que siempre termine en '/' (Para evitar errores de unión de archivos).
    protected function path(): Attribute
    {
        return Attribute::make(
            set: fn ($value) => rtrim(str_replace('\\', '/', $value), '/') . '/',
        );
    }

    // --- 2. RELACIÓN FUNDAMENTAL ---
    // Conecta la carpeta con sus grabaciones.
    // Sin esto, el FolderManagerController fallaría al contar items.
    public function recordings()
    {
        return $this->hasMany(Recording::class);
    }
}