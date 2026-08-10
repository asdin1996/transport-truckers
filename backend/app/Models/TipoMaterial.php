<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TipoMaterial extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'tipos_material';

    protected $fillable = ['nombre'];
}
