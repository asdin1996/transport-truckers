<?php

namespace App\Services;

use App\Repositories\GestionRepository;

class GestionService extends BaseService
{
    public function __construct(GestionRepository $repository)
    {
        parent::__construct($repository);
    }

    public function byTrip(int $viajeId)
    {
        return $this->repository->byTrip($viajeId);
    }

    public function create(array $data)
    {
        return $this->repository->create($data);
    }

    public function update(int $id, array $data): bool
    {
        return $this->repository->update($id, $data);
    }

    public function find(int $id)
    {
        return $this->repository->findById($id);
    }

    public function delete(int $id): bool
    {
        return $this->repository->delete($id);
    }
}
