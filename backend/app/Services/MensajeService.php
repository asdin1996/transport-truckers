<?php

namespace App\Services;

use App\Models\Mensaje;
use App\Repositories\MensajeRepository;
use Illuminate\Support\Collection;

class MensajeService extends BaseService
{
    public function __construct(MensajeRepository $repository)
    {
        parent::__construct($repository);
    }

    public function enviar(int $deUserId, array $data): Mensaje
    {
        return $this->repository->create([
            'de_user_id'   => $deUserId,
            'para_user_id' => $data['para_user_id'],
            'contenido'    => $data['contenido'],
            'leido'        => false,
            'leido_at'     => null,
        ]);
    }

    public function conversacion(int $userId1, int $userId2): Collection
    {
        return $this->repository->conversacion($userId1, $userId2);
    }

    public function noLeidos(int $userId): Collection
    {
        return $this->repository->noLeidos($userId);
    }

    public function marcarLeidosEnConversacion(int $deUserId, int $paraUserId): int
    {
        return $this->repository->marcarLeidosEnConversacion($deUserId, $paraUserId);
    }
}
