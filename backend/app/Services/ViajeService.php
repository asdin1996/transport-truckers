<?php

namespace App\Services;

use App\Models\Viaje;
use App\Repositories\ViajeRepository;
use Illuminate\Support\Facades\Auth;

class ViajeService extends BaseService
{
    public function __construct(ViajeRepository $repository)
    {
        parent::__construct($repository);
    }

    public function getAll()
    {
        $user = Auth::user();

        if ($user->isAdmin()) {
            return $this->repository->allWithRelations();
        }

        return $this->repository->byDriver($user->camionero->id);
    }

    public function find(int $id): ?Viaje
    {
        return $this->repository->findWithRelations($id);
    }

    public function create(array $data): Viaje
    {
        return $this->repository->create($data);
    }

    public function update(int $id, array $data): bool
    {
        return $this->repository->update($id, $data);
    }

    public function changeStatus(Viaje $viaje, string $status): bool
    {
        $data = ['estado' => $status];

        if ($status === 'en_camino' && ! $viaje->hora_inicio) {
            $data['hora_inicio'] = now();
        }

        if ($status === 'finalizado') {
            $data['fecha_fin'] = now()->toDateString();
            if ($viaje->hora_inicio) {
                $data['hora_fin'] = now();
                $data['duracion_minutos'] = (int) $viaje->hora_inicio->diffInMinutes(now());
            }
        }

        return $this->repository->update($viaje->id, $data);
    }

    public function delete(int $id): bool
    {
        return $this->repository->delete($id);
    }

    public function canAccess(Viaje $viaje): bool
    {
        $user = Auth::user();

        if ($user->isAdmin()) {
            return true;
        }

        return $user->camionero && $viaje->camionero_id === $user->camionero->id;
    }
}
