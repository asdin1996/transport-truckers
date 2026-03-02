<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Viaje extends Model
{
    use HasFactory, SoftDeletes;

    const ESTADOS = ['pendiente', 'en_curso', 'completado', 'cancelado'];

    protected $fillable = [
        'camionero_id',
        'vehiculo_id',
        'ruta_id',
        'estado',
        'fecha_inicio',
        'fecha_fin',
        'notas',
        'paradas_completadas',
        'hora_inicio',
        'hora_fin',
        'duracion_minutos',
    ];

    protected function casts(): array
    {
        return [
            'fecha_inicio'          => 'datetime',
            'fecha_fin'             => 'datetime',
            'hora_inicio'           => 'datetime',
            'hora_fin'              => 'datetime',
            'duracion_minutos'      => 'integer',
            'paradas_completadas'   => 'array',
        ];
    }

    public function camionero(): BelongsTo
    {
        return $this->belongsTo(Camionero::class);
    }

    public function vehiculo(): BelongsTo
    {
        return $this->belongsTo(Vehiculo::class);
    }

    public function ruta(): BelongsTo
    {
        return $this->belongsTo(Ruta::class);
    }

    public function gastos(): HasMany
    {
        return $this->hasMany(Gasto::class);
    }

    public function documentos(): HasMany
    {
        return $this->hasMany(Documento::class);
    }
}
