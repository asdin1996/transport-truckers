<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Ruta extends Model
{
    use HasFactory;

    protected $fillable = [
        'origen',
        'destino',
        'km_estimados',
        'paradas',
    ];

    protected function casts(): array
    {
        return [
            'paradas' => 'array',
        ];
    }
}
