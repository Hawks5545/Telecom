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

    // Mutador para normalizar rutas (reemplaza \ por / y asegura slash final)
    public function setPathAttribute($value)
    {
        $cleanPath = str_replace('\\', '/', $value);
        $this->attributes['path'] = rtrim($cleanPath, '/') . '/';
    }

    // --- RELACIÓN FALTANTE (Soluciona el error del Dashboard) ---
    // Una carpeta tiene muchas grabaciones
    public function recordings()
    {
        return $this->hasMany(Recording::class);
    }
}