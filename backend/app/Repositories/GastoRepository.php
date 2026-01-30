<?php

namespace App\Repositories;

use App\Models\Gasto;

class GastoRepository extends BaseRepository
{
    public function __construct(Gasto $model)
    {
        parent::__construct($model);
    }

    public function porViaje(int $viajeId)
    {
        return $this->model->where('viaje_id', $viajeId)->get();
    }

    public function findWithViaje(int $id): ?Gasto
    {
        return $this->model->with('viaje')->find($id);
    }
}
