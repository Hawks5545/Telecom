<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    use HasFactory;

    // Se agregó 'metadata' para permitir que el JSON de las descargas se guarde en la BD
    protected $fillable = [
        'user_id', 
        'action', 
        'details', 
        'metadata', // <--- AQUÍ ESTÁ LA SOLUCIÓN
        'ip_address'
    ];

    // Relación: Un log pertenece a un usuario
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}