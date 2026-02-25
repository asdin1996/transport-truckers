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
            ->with('user')
            ->withExists(['viajes as en_viaje' => fn ($q) => $q->where('estado', 'en_curso')])
            ->get();
    }

    public function findWithUser(int $id): ?Camionero
    {
        return $this->model
            ->with('user')
            ->withExists(['viajes as en_viaje' => fn ($q) => $q->where('estado', 'en_curso')])
            ->find($id);
    }
}
