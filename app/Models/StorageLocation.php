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

    public function setPathAttribute($value)
    {
        $cleanPath = str_replace('\\', '/', $value);
        $this->attributes['path'] = rtrim($cleanPath, '/') . '/';
    }
}