<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class OrganizacionContratante extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'organizaciones_contratantes';

    protected $fillable = ['nombre'];
}
