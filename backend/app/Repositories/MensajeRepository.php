<?php

namespace App\Repositories;

use App\Models\Mensaje;
use Illuminate\Support\Collection;

class MensajeRepository extends BaseRepository
{
    public function __construct(Mensaje $model)
    {
        parent::__construct($model);
    }

    public function conversation(int $userId1, int $userId2): Collection
    {
        return $this->model
            ->with(['remitente', 'destinatario'])
            ->where(function ($q) use ($userId1, $userId2) {
                $q->where('de_user_id', $userId1)->where('para_user_id', $userId2);
            })
            ->orWhere(function ($q) use ($userId1, $userId2) {
                $q->where('de_user_id', $userId2)->where('para_user_id', $userId1);
            })
            ->orderBy('created_at')
            ->get();
    }

    public function unread(int $userId): Collection
    {
        return $this->model
            ->where('para_user_id', $userId)
            ->where('leido', false)
            ->with('remitente')
            ->get();
    }

    public function markConversationAsRead(int $fromUserId, int $toUserId): int
    {
        return $this->model
            ->where('de_user_id', $fromUserId)
            ->where('para_user_id', $toUserId)
            ->where('leido', false)
            ->update(['leido' => true, 'leido_at' => now()]);
    }
}
