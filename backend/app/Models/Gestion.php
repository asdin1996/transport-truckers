<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Gestion extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'gestiones';

    protected $fillable = ['viaje_id', 'user_id', 'contenido'];

    public function viaje(): BelongsTo
    {
        return $this->belongsTo(Viaje::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
