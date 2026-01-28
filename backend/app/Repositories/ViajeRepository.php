<?php

namespace App\Repositories;

use App\Models\Viaje;

class ViajeRepository extends BaseRepository
{
    public function __construct(Viaje $model)
    {
        parent::__construct($model);
    }

    public function allWithRelations()
    {
        return $this->model->with(['camionero', 'vehiculo', 'ruta'])->get();
    }

    public function findWithRelations(int $id): ?Viaje
    {
        return $this->model->with(['camionero', 'vehiculo', 'ruta'])->find($id);
    }

    public function porCamionero(int $camioneroId)
    {
        return $this->model->with(['vehiculo', 'ruta'])->where('camionero_id', $camioneroId)->get();
    }
}
