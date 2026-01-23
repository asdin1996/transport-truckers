<?php

namespace App\Services;

use App\Repositories\VehiculoRepository;

class VehiculoService extends BaseService
{
    public function __construct(VehiculoRepository $repository)
    {
        parent::__construct($repository);
    }

    public function listar()
    {
        return $this->repository->allWithEmpresa();
    }

    public function obtener(int $id)
    {
        return $this->repository->findWithEmpresa($id);
    }

    public function crear(array $data)
    {
        return $this->repository->create($data);
    }

    public function actualizar(int $id, array $data): bool
    {
        return $this->repository->update($id, $data);
    }

    public function eliminar(int $id): bool
    {
        return $this->repository->delete($id);
    }
}
