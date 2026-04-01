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

    protected $fillable = [
        'storage_location_id',
        'filename',
        'full_path',
        'folder_path',
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
        'fecha_grabacion'     => 'datetime',
        'original_created_at' => 'datetime',
    ];

    protected function path(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->full_path,
            set: fn ($value) => ['full_path' => $value],
        );
    }

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

    public function scopeFilter(Builder $query, array $filters)
    {
        // ✅ OPTIMIZADO: valor% en vez de %valor% — usa el índice de cédula
        $query->when($filters['cedula'] ?? null, function ($q, $cedula) {
            $q->where('cedula', 'like', "{$cedula}%");
        });

        // ✅ OPTIMIZADO: valor% en vez de %valor% — usa el índice de teléfono
        $query->when($filters['telefono'] ?? null, function ($q, $tel) {
            $q->where('telefono', 'like', "{$tel}%");
        });

        // Filename sigue con %valor% porque se busca por fragmento del nombre
        $query->when($filters['filename'] ?? null, function ($q, $file) {
            $q->where('filename', 'like', "%{$file}%");
        });

        // ✅ OPTIMIZADO: campaña usa índice existente
        $query->when($filters['campana'] ?? null, function ($q, $camp) {
            $q->where('campana', 'like', "{$camp}%");
        });

        // Filtro por Carpeta Madre (ID) — ya usa índice
        $query->when($filters['folderId'] ?? null, function ($q, $folderId) {
            $q->where('storage_location_id', $folderId);
        });

        // Filtro Inteligente de Fechas — ya usa índice
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

    public function storageLocation()
    {
        return $this->belongsTo(StorageLocation::class, 'storage_location_id');
    }
}
