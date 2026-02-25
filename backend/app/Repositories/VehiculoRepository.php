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
        return $this->model
            ->with('empresa')
            ->withExists(['viajes as en_viaje' => fn ($q) => $q->where('estado', 'en_curso')])
            ->get();
    }

    public function findWithEmpresa(int $id): ?Vehiculo
    {
        return $this->model
            ->with('empresa')
            ->withExists(['viajes as en_viaje' => fn ($q) => $q->where('estado', 'en_curso')])
            ->find($id);
    }
}
