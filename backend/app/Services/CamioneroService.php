<?php

namespace App\Services;

use App\Models\User;
use App\Repositories\CamioneroRepository;
use Illuminate\Support\Facades\Hash;

class CamioneroService extends BaseService
{
    protected CamioneroRepository $repository;

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
        $user = User::create([
            'name'     => $data['nombre'] . ' ' . $data['apellidos'],
            'email'    => $data['email'],
            'password' => Hash::make($data['dni']),
            'role'     => 'camionero',
        ]);

        return $this->repository->create(array_merge($data, ['user_id' => $user->id]));
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

            if ($userUpdates) {
                $camionero->user->update($userUpdates);
            }
        }

        return $this->repository->update($id, $data);
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
