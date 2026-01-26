<?php

namespace App\Repositories;

use App\Models\Ruta;

class RutaRepository extends BaseRepository
{
    public function __construct(Ruta $model)
    {
        parent::__construct($model);
    }
}
