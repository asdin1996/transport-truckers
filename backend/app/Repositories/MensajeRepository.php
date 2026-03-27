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

    public function resumen(int $userId): Collection
    {
        return $this->model
            ->selectRaw('
                IF(de_user_id = ?, para_user_id, de_user_id) AS contact_id,
                MAX(created_at) AS ultimo_mensaje_at,
                SUM(CASE WHEN para_user_id = ? AND leido = 0 THEN 1 ELSE 0 END) AS no_leidos
            ', [$userId, $userId])
            ->where(function ($q) use ($userId) {
                $q->where('de_user_id', $userId)->orWhere('para_user_id', $userId);
            })
            ->groupByRaw('IF(de_user_id = ?, para_user_id, de_user_id)', [$userId])
            ->orderByDesc('ultimo_mensaje_at')
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
