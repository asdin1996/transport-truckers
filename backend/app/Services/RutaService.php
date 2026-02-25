<?php

namespace App\Services;

use App\Repositories\RutaRepository;

class RutaService extends BaseService
{
    public function __construct(RutaRepository $repository)
    {
        parent::__construct($repository);
    }

    public function getAll()
    {
        return $this->repository->all();
    }

    public function find(int $id)
    {
        return $this->repository->findById($id);
    }

    public function create(array $data)
    {
        return $this->repository->create($data);
    }

    public function update(int $id, array $data): bool
    {
        return $this->repository->update($id, $data);
    }

    public function delete(int $id): bool
    {
        return $this->repository->delete($id);
    }
}
