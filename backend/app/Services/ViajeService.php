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

    public function listar()
    {
        $user = Auth::user();

        if ($user->isAdmin()) {
            return $this->repository->allWithRelations();
        }

        return $this->repository->porCamionero($user->camionero->id);
    }

    public function obtener(int $id): ?Viaje
    {
        return $this->repository->findWithRelations($id);
    }

    public function crear(array $data): Viaje
    {
        return $this->repository->create($data);
    }

    public function actualizar(int $id, array $data): bool
    {
        return $this->repository->update($id, $data);
    }

    public function cambiarEstado(Viaje $viaje, string $estado): bool
    {
        return $this->repository->update($viaje->id, ['estado' => $estado]);
    }

    public function eliminar(int $id): bool
    {
        return $this->repository->delete($id);
    }

    public function puedeAcceder(Viaje $viaje): bool
    {
        $user = Auth::user();

        if ($user->isAdmin()) {
            return true;
        }

        return $user->camionero && $viaje->camionero_id === $user->camionero->id;
    }
}
