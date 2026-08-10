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
        return $this->model->with(['camionero', 'vehiculo', 'tipoMaterial'])
            ->orderByRaw('fecha_inicio IS NULL, fecha_inicio DESC')
            ->get();
    }

    public function findWithRelations(int $id): ?Viaje
    {
        return $this->model->with(['camionero', 'vehiculo', 'tipoMaterial'])->find($id);
    }

    public function byDriver(int $camioneroId)
    {
        return $this->model->with(['vehiculo', 'tipoMaterial'])
            ->where('camionero_id', $camioneroId)
            ->orderByRaw('fecha_inicio IS NULL, fecha_inicio DESC')
            ->get();
    }

    public function byAlmacenes(\Illuminate\Support\Collection $almacenIds)
    {
        return $this->model->with(['camionero', 'vehiculo', 'tipoMaterial'])
            ->whereHas('camionero', fn($q) => $q->whereIn('almacen_id', $almacenIds))
            ->orderByRaw('fecha_inicio IS NULL, fecha_inicio DESC')
            ->get();
    }
}
