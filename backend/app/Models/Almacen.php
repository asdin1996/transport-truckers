<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Almacen extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'almacenes';

    protected $fillable = ['nombre'];

    public function usuarios(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'almacen_user');
    }

    public function camioneros(): HasMany
    {
        return $this->hasMany(Camionero::class);
    }
}
