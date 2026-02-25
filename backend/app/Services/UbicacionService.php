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

    public function register(int $driverId, array $data): Ubicacion
    {
        return $this->repository->create([
            'camionero_id'  => $driverId,
            'viaje_id'      => $data['viaje_id'] ?? null,
            'lat'           => $data['lat'],
            'lng'           => $data['lng'],
            'registrado_at' => $data['registrado_at'] ?? now(),
        ]);
    }

    public function latestByDriver(int $driverId): ?Ubicacion
    {
        return $this->repository->latestByDriver($driverId);
    }

    public function latestByTrip(int $viajeId): ?Ubicacion
    {
        return $this->repository->latestByTrip($viajeId);
    }

    public function historyByTrip(int $viajeId)
    {
        return $this->repository->historyByTrip($viajeId);
    }
}
