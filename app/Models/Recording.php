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
        'size',
        'duration',
        'extension',
        'cedula',
        'telefono',
        'campana',
        'fecha_grabacion'
    ];

    // Casteamos la fecha para que Laravel la trate como objeto Carbon automáticamente
    protected $casts = [
        'fecha_grabacion' => 'datetime',
    ];
}