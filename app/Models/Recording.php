<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Recording extends Model
{
    use HasFactory;

    protected $fillable = [
        'storage_location_id',
        'filename',
        'path',
        'full_path',
        'size',
        'duration',
        'extension',
        'cedula',
        'telefono',
        'campana',
        'fecha_grabacion',
        'original_created_at',
        'folder_path'
    ];

    protected $casts = [
        'fecha_grabacion' => 'datetime',
        'original_created_at' => 'datetime',
    ];

    // Relación: Una grabación pertenece a una ubicación de almacenamiento
    public function storageLocation()
    {
        return $this->belongsTo(StorageLocation::class, 'storage_location_id');
    }
}