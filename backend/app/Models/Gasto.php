<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Gasto extends Model
{
    use HasFactory, SoftDeletes;

    const TIPOS = ['combustible', 'dieta', 'peaje', 'otro'];

    protected $fillable = [
        'viaje_id',
        'tipo',
        'importe',
        'descripcion',
        'fecha',
        'foto_ticket',
    ];

    protected function casts(): array
    {
        return [
            'importe' => 'decimal:2',
            'fecha' => 'date',
        ];
    }

    public function viaje(): BelongsTo
    {
        return $this->belongsTo(Viaje::class);
    }
}
