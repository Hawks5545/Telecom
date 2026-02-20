<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Builder;
use Carbon\Carbon;

class Recording extends Model
{
    use HasFactory;

    // 1. LIMPIEZA: Quitamos 'path' porque ya no existe fisicamente en la BD.
    // Dejamos 'full_path' (ruta real) y 'folder_path' (ruta relativa/visual).
    protected $fillable = [
        'storage_location_id',
        'filename',
        'full_path',   // Ruta absoluta (D:/Grabaciones/Claro/audio.mp3)
        'folder_path', // Ruta visual (2025/audio.mp3)
        'size',
        'duration',
        'extension',
        'cedula',
        'telefono',
        'campana',
        'fecha_grabacion',
        'original_created_at'
    ];

    protected $casts = [
        'fecha_grabacion' => 'datetime',
        'original_created_at' => 'datetime',
    ];

    // --- 2. EL TRUCO DE COMPATIBILIDAD (ACCESSOR) ---
    // Esto salva tu vida: Si algún controlador viejo pide $recording->path,
    // Laravel le entregará automáticamente el valor de 'full_path'.
    // Así no tienes que refactorizar todo el código antiguo hoy mismo.
    protected function path(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->full_path, 
            set: fn ($value) => ['full_path' => $value],
        );
    }

    // --- 3. FORMATO DE PESO (ACCESSOR) ---
    // En el Frontend o JSON, podrás usar $recording->formatted_size
    // Devuelve: "2.5 MB", "500 KB", etc.
    protected function formattedSize(): Attribute
    {
        return Attribute::make(
            get: function ($value, $attributes) {
                $bytes = $attributes['size'] ?? 0;
                if ($bytes <= 0) return '0 B';
                $units = ['B', 'KB', 'MB', 'GB', 'TB'];
                $pow = floor(log($bytes) / log(1024));
                $pow = min($pow, count($units) - 1);
                $bytes /= pow(1024, $pow);
                return round($bytes, 2) . ' ' . $units[$pow];
            }
        );
    }

    // --- 4. MOTOR DE BÚSQUEDA (SCOPE) ---
    // Esto limpia tu SearchController. Toda la lógica de filtros vive aquí.
    public function scopeFilter(Builder $query, array $filters)
    {
        // Búsqueda Flexible por Cédula (Optimizado si tienes índices)
        $query->when($filters['cedula'] ?? null, function ($q, $cedula) {
            $q->where('cedula', 'like', "%{$cedula}%");
        });

        // Búsqueda Flexible por Teléfono
        $query->when($filters['telefono'] ?? null, function ($q, $tel) {
            $q->where('telefono', 'like', "%{$tel}%");
        });

        // Búsqueda por Nombre de Archivo
        $query->when($filters['filename'] ?? null, function ($q, $file) {
            $q->where('filename', 'like', "%{$file}%");
        });

        // Filtro por Campaña (Texto)
        $query->when($filters['campana'] ?? null, function ($q, $camp) {
            $q->where('campana', 'like', "%{$camp}%");
        });

        // Filtro por Carpeta Madre (ID)
        $query->when($filters['folderId'] ?? null, function ($q, $folderId) {
            $q->where('storage_location_id', $folderId);
        });

        // Filtro Inteligente de Fechas
        if (!empty($filters['dateFrom']) && !empty($filters['dateTo'])) {
            $query->whereBetween('fecha_grabacion', [
                Carbon::parse($filters['dateFrom'])->startOfDay(),
                Carbon::parse($filters['dateTo'])->endOfDay()
            ]);
        } elseif (!empty($filters['dateFrom'])) {
            $query->where('fecha_grabacion', '>=', Carbon::parse($filters['dateFrom'])->startOfDay());
        } elseif (!empty($filters['dateTo'])) {
            $query->where('fecha_grabacion', '<=', Carbon::parse($filters['dateTo'])->endOfDay());
        }
    }

    // Relación: Una grabación pertenece a una carpeta madre (Ubicación)
    public function storageLocation()
    {
        return $this->belongsTo(StorageLocation::class, 'storage_location_id');
    }
}