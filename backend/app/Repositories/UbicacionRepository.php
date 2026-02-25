<?php

namespace App\Repositories;

use App\Models\Ubicacion;

class UbicacionRepository extends BaseRepository
{
    public function __construct(Ubicacion $model)
    {
        parent::__construct($model);
    }

    public function latestByDriver(int $camioneroId): ?Ubicacion
    {
        return $this->model
            ->where('camionero_id', $camioneroId)
            ->latest('registrado_at')
            ->first();
    }

    public function latestByTrip(int $viajeId): ?Ubicacion
    {
        return $this->model
            ->where('viaje_id', $viajeId)
            ->latest('registrado_at')
            ->first();
    }

    public function historyByTrip(int $viajeId)
    {
        return $this->model
            ->where('viaje_id', $viajeId)
            ->orderBy('registrado_at')
            ->get();
    }
}
