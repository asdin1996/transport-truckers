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

    const ESTADOS = ['pendiente', 'en_camino', 'llegada_destino', 'cargando', 'descargando', 'finalizado', 'cancelado'];

    protected $fillable = [
        'camionero_id',
        'vehiculo_id',
        'tipo',
        'tipo_material_id',
        'origen',
        'destino',
        'estado',
        'orden',
        'fecha_inicio',
        'fecha_fin',
        'notas',
        'paradas_completadas',
        'hora_inicio',
        'hora_fin',
        'duracion_minutos',
    ];

    const TIPOS = ['carga', 'descarga', 'adelantar_carga'];

    protected function casts(): array
    {
        return [
            'fecha_inicio'          => 'date:Y-m-d',
            'fecha_fin'             => 'date:Y-m-d',
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

    public function tipoMaterial(): BelongsTo
    {
        return $this->belongsTo(TipoMaterial::class);
    }

    public function vehiculo(): BelongsTo
    {
        return $this->belongsTo(Vehiculo::class);
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
