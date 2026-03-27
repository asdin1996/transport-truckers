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

    public function send(int $fromUserId, array $data): Mensaje
    {
        return $this->repository->create([
            'de_user_id'   => $fromUserId,
            'para_user_id' => $data['para_user_id'],
            'contenido'    => $data['contenido'],
            'leido'        => false,
            'leido_at'     => null,
        ]);
    }

    public function conversation(int $userId1, int $userId2): Collection
    {
        return $this->repository->conversation($userId1, $userId2);
    }

    public function unread(int $userId): Collection
    {
        return $this->repository->unread($userId);
    }

    public function resumen(int $userId): \Illuminate\Support\Collection
    {
        return $this->repository->resumen($userId);
    }

    public function markConversationAsRead(int $fromUserId, int $toUserId): int
    {
        return $this->repository->markConversationAsRead($fromUserId, $toUserId);
    }
}
