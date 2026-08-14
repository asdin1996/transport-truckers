<?php

namespace App\Repositories;

use App\Models\Viaje;

class ViajeRepository extends BaseRepository
{
    public function __construct(Viaje $model)
    {
        parent::__construct($model);
    }

    private function withRelaciones()
    {
        return $this->model->with([
            'camionero',
            'vehiculo',
            'tipoMaterial',
            'organizacionContratante',
            'motivoCancelacion',
        ]);
    }

    public function allWithRelations()
    {
        return $this->withRelaciones()
            ->orderByRaw('fecha_inicio IS NULL, fecha_inicio DESC')
            ->get();
    }

    public function findWithRelations(int $id): ?Viaje
    {
        return $this->withRelaciones()->find($id);
    }

    public function byDriver(int $camioneroId)
    {
        return $this->model->with(['vehiculo', 'tipoMaterial', 'organizacionContratante', 'motivoCancelacion'])
            ->where('camionero_id', $camioneroId)
            ->orderByRaw('fecha_inicio IS NULL, fecha_inicio DESC')
            ->get();
    }

    public function byAlmacenes(\Illuminate\Support\Collection $almacenIds)
    {
        return $this->withRelaciones()
            ->whereHas('camionero', fn ($q) => $q->whereIn('almacen_id', $almacenIds))
            ->orderByRaw('fecha_inicio IS NULL, fecha_inicio DESC')
            ->get();
    }

    public function sinConductor()
    {
        return $this->withRelaciones()
            ->whereNull('camionero_id')
            ->whereNotIn('estado', ['finalizado', 'cancelado'])
            ->orderByRaw('fecha_inicio IS NULL, fecha_inicio DESC')
            ->get();
    }
}
