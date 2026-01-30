<?php

namespace App\Services;

use App\Models\Gasto;
use App\Models\Viaje;
use App\Repositories\GastoRepository;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class GastoService extends BaseService
{
    public function __construct(GastoRepository $repository)
    {
        parent::__construct($repository);
    }

    public function porViaje(int $viajeId)
    {
        return $this->repository->porViaje($viajeId);
    }

    public function obtener(int $id): ?Gasto
    {
        return $this->repository->findWithViaje($id);
    }

    public function crear(array $data, ?UploadedFile $foto): Gasto
    {
        if ($foto) {
            $data['foto_ticket'] = $foto->store('tickets', 'public');
        }

        return $this->repository->create($data);
    }

    public function actualizar(int $id, array $data, ?UploadedFile $foto): bool
    {
        if ($foto) {
            $gasto = $this->repository->findById($id);
            if ($gasto?->foto_ticket) {
                Storage::disk('public')->delete($gasto->foto_ticket);
            }
            $data['foto_ticket'] = $foto->store('tickets', 'public');
        }

        return $this->repository->update($id, $data);
    }

    public function eliminar(int $id): bool
    {
        $gasto = $this->repository->findById($id);
        if ($gasto?->foto_ticket) {
            Storage::disk('public')->delete($gasto->foto_ticket);
        }

        return $this->repository->delete($id);
    }

    public function puedeAcceder(Gasto $gasto, int $camioneroId, bool $esAdmin): bool
    {
        if ($esAdmin) {
            return true;
        }

        return $gasto->viaje->camionero_id === $camioneroId;
    }
}
