<?php

namespace App\Repositories;

use App\Models\Documento;

class DocumentoRepository extends BaseRepository
{
    public function __construct(Documento $model)
    {
        parent::__construct($model);
    }

    public function porViaje(int $viajeId)
    {
        return $this->model->where('viaje_id', $viajeId)->get();
    }

    public function findWithViaje(int $id): ?Documento
    {
        return $this->model->with('viaje')->find($id);
    }
}
