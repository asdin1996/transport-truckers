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
        return $this->model->with('user')->get();
    }

    public function findWithUser(int $id): ?Camionero
    {
        return $this->model->with('user')->find($id);
    }
}
