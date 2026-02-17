<?php

namespace App\Services;

use App\Repositories\GestionRepository;

class GestionService extends BaseService
{
    public function __construct(GestionRepository $repository)
    {
        parent::__construct($repository);
    }

    public function porViaje(int $viajeId)
    {
        return $this->repository->porViaje($viajeId);
    }

    public function crear(array $data)
    {
        return $this->repository->create($data);
    }

    public function actualizar(int $id, array $data): bool
    {
        return $this->repository->update($id, $data);
    }

    public function obtener(int $id)
    {
        return $this->repository->findById($id);
    }

    public function eliminar(int $id): bool
    {
        return $this->repository->delete($id);
    }
}
