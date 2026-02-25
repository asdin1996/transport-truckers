<?php

namespace App\Services;

use App\Repositories\CamioneroRepository;

class CamioneroService extends BaseService
{
    public function __construct(CamioneroRepository $repository)
    {
        parent::__construct($repository);
    }

    public function getAll()
    {
        return $this->repository->allWithUser();
    }

    public function find(int $id)
    {
        return $this->repository->findWithUser($id);
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
