<?php

namespace App\Repositories;

use App\Models\Camionero;

class CamioneroRepository extends BaseRepository
{
    public function __construct(Camionero $model)
    {
        parent::__construct($model);
    }

    public function allWithUser()
    {
        return $this->model
            ->with(['user', 'almacen'])
            ->withExists(['viajes as en_viaje' => fn ($q) => $q->whereIn('estado', ['en_camino', 'cargando', 'descargando', 'llegada_destino'])])
            ->get();
    }

    public function byAlmacenes(\Illuminate\Support\Collection $almacenIds)
    {
        return $this->model
            ->with(['user', 'almacen'])
            ->withExists(['viajes as en_viaje' => fn ($q) => $q->whereIn('estado', ['en_camino', 'cargando', 'descargando', 'llegada_destino'])])
            ->whereIn('almacen_id', $almacenIds)
            ->get();
    }

    public function findWithUser(int $id): ?Camionero
    {
        return $this->model
            ->with(['user', 'almacen'])
            ->withExists(['viajes as en_viaje' => fn ($q) => $q->whereIn('estado', ['en_camino', 'cargando', 'descargando', 'llegada_destino'])])
            ->find($id);
    }
}
