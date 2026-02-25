<?php

namespace App\Services;

use App\Models\Gasto;
use App\Repositories\GastoRepository;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class GastoService extends BaseService
{
    public function __construct(GastoRepository $repository)
    {
        parent::__construct($repository);
    }

    public function byTrip(int $viajeId)
    {
        return $this->repository->byTrip($viajeId);
    }

    public function find(int $id): ?Gasto
    {
        return $this->repository->findWithViaje($id);
    }

    public function create(array $data, ?UploadedFile $photo): Gasto
    {
        if ($photo) {
            $data['foto_ticket'] = $photo->store('tickets', 'public');
        }

        return $this->repository->create($data);
    }

    public function update(int $id, array $data, ?UploadedFile $photo): bool
    {
        if ($photo) {
            $expense = $this->repository->findById($id);
            if ($expense?->foto_ticket) {
                Storage::disk('public')->delete($expense->foto_ticket);
            }
            $data['foto_ticket'] = $photo->store('tickets', 'public');
        }

        return $this->repository->update($id, $data);
    }

    public function delete(int $id): bool
    {
        $expense = $this->repository->findById($id);
        if ($expense?->foto_ticket) {
            Storage::disk('public')->delete($expense->foto_ticket);
        }

        return $this->repository->delete($id);
    }

    public function canAccess(Gasto $expense, int $camioneroId, bool $isAdmin): bool
    {
        if ($isAdmin) {
            return true;
        }

        return $expense->viaje->camionero_id === $camioneroId;
    }
}
