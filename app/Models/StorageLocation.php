<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StorageLocation extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'path',
        'description',
        'is_active'
    ];

    // Helper para asegurar que la ruta siempre termine en slash (/)
    // Esto evita errores como "C:/AudiosArchivo.mp3"
    public function setPathAttribute($value)
    {
        // Normaliza las barras a formato Linux (/) y asegura el final
        $cleanPath = str_replace('\\', '/', $value);
        $this->attributes['path'] = rtrim($cleanPath, '/') . '/';
    }
}