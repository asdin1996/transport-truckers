<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Ubicacion extends Model
{
    use HasFactory;

    protected $table = 'ubicaciones';

    protected $fillable = [
        'camionero_id',
        'viaje_id',
        'lat',
        'lng',
        'registrado_at',
    ];

    protected function casts(): array
    {
        return [
            'lat'           => 'float',
            'lng'           => 'float',
            'registrado_at' => 'datetime',
        ];
    }

    public function camionero(): BelongsTo
    {
        return $this->belongsTo(Camionero::class);
    }

    public function viaje(): BelongsTo
    {
        return $this->belongsTo(Viaje::class);
    }
}
