<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Mensaje extends Model
{
    use HasFactory;

    protected $fillable = [
        'de_user_id',
        'para_user_id',
        'contenido',
        'leido',
        'leido_at',
    ];

    protected function casts(): array
    {
        return [
            'leido' => 'boolean',
            'leido_at' => 'datetime',
        ];
    }

    public function remitente(): BelongsTo
    {
        return $this->belongsTo(User::class, 'de_user_id');
    }

    public function destinatario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'para_user_id');
    }
}
