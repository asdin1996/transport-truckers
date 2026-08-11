<?php

namespace App\Services;

use App\Models\User;
use App\Repositories\CamioneroRepository;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class CamioneroService extends BaseService
{
    /** @var CamioneroRepository */
    protected $repository;

    public function __construct(CamioneroRepository $repository)
    {
        parent::__construct($repository);
    }

    public function getAll(bool $soloMisAlmacenes = false)
    {
        $user = Auth::user();

        if ($soloMisAlmacenes && $user->isGestor()) {
            $almacenIds = $user->almacenes()->pluck('almacenes.id');
            return $this->repository->byAlmacenes($almacenIds);
        }

        return $this->repository->allWithUser();
    }

    public function find(int $id)
    {
        return $this->repository->findWithUser($id);
    }

    public function create(array $data)
    {
        $user = User::create([
            'name'     => $data['nombre'] . ' ' . $data['apellidos'],
            'email'    => $data['email'],
            'password' => Hash::make($data['dni']),
            'role'     => $data['rol'] ?? 'camionero',
        ]);

        return $this->repository->create(array_merge(
            array_diff_key($data, ['rol' => null]),
            ['user_id' => $user->id]
        ));
    }

    public function update(int $id, array $data): bool
    {
        $camionero = $this->repository->findWithUser($id);

        if ($camionero) {
            $userUpdates = [];

            if (isset($data['nombre']) || isset($data['apellidos'])) {
                $nombre    = $data['nombre']    ?? $camionero->nombre;
                $apellidos = $data['apellidos'] ?? $camionero->apellidos;
                $userUpdates['name'] = $nombre . ' ' . $apellidos;
            }

            if (isset($data['email'])) {
                $userUpdates['email'] = $data['email'];
            }

            if (isset($data['dni'])) {
                $userUpdates['password'] = Hash::make($data['dni']);
            }

            if (isset($data['rol'])) {
                $userUpdates['role'] = $data['rol'];
            }

            if ($userUpdates) {
                $camionero->user->update($userUpdates);
            }
        }

        return $this->repository->update($id, array_diff_key($data, ['rol' => null]));
    }

    public function delete(int $id): bool
    {
        $camionero = $this->repository->findWithUser($id);

        $deleted = $this->repository->delete($id);

        if ($deleted && $camionero?->user) {
            $camionero->user->delete();
        }

        return $deleted;
    }
}
