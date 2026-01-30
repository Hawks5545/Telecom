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

    protected $casts = [
        'fecha_grabacion' => 'datetime',
    ];
}