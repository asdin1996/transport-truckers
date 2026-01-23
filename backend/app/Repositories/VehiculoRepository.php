<?php

namespace App\Repositories;

use App\Models\Vehiculo;

class VehiculoRepository extends BaseRepository
{
    public function __construct(Vehiculo $model)
    {
        parent::__construct($model);
    }

    public function allWithEmpresa()
    {
        return $this->model->with('empresa')->get();
    }

    public function findWithEmpresa(int $id): ?Vehiculo
    {
        return $this->model->with('empresa')->find($id);
    }
}
