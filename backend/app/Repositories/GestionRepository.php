<?php

namespace App\Repositories;

use App\Models\Gestion;

class GestionRepository extends BaseRepository
{
    public function __construct(Gestion $model)
    {
        parent::__construct($model);
    }

    public function byTrip(int $viajeId)
    {
        return $this->model->with('user:id,name')
            ->where('viaje_id', $viajeId)
            ->orderBy('created_at', 'desc')
            ->get();
    }
}
