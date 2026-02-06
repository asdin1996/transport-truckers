<?php

namespace App\Services;

use App\Models\Ubicacion;
use App\Repositories\UbicacionRepository;

class UbicacionService extends BaseService
{
    public function __construct(UbicacionRepository $repository)
    {
        parent::__construct($repository);
    }

    public function registrar(int $camioneroId, array $data): Ubicacion
    {
        return $this->repository->create([
            'camionero_id'  => $camioneroId,
            'viaje_id'      => $data['viaje_id'] ?? null,
            'lat'           => $data['lat'],
            'lng'           => $data['lng'],
            'registrado_at' => $data['registrado_at'] ?? now(),
        ]);
    }

    public function ultimaPorCamionero(int $camioneroId): ?Ubicacion
    {
        return $this->repository->ultimaPorCamionero($camioneroId);
    }

    public function ultimaPorViaje(int $viajeId): ?Ubicacion
    {
        return $this->repository->ultimaPorViaje($viajeId);
    }

    public function historialPorViaje(int $viajeId)
    {
        return $this->repository->historialPorViaje($viajeId);
    }
}
