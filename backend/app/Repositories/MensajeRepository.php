<?php

namespace App\Repositories;

use App\Models\Mensaje;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

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
        $rows = DB::select("
            SELECT contact_id,
                   MAX(created_at)                         AS ultimo_mensaje_at,
                   CAST(SUM(no_leidos_flag) AS UNSIGNED)   AS no_leidos
            FROM (
                SELECT
                    IF(de_user_id = ?, para_user_id, de_user_id) AS contact_id,
                    created_at,
                    CASE WHEN para_user_id = ? AND leido = 0 THEN 1 ELSE 0 END AS no_leidos_flag
                FROM mensajes
                WHERE de_user_id = ? OR para_user_id = ?
            ) sub
            GROUP BY contact_id
            ORDER BY ultimo_mensaje_at DESC
        ", [$userId, $userId, $userId, $userId]);

        return collect($rows)->map(fn ($row) => [
            'contact_id'        => (int) $row->contact_id,
            'ultimo_mensaje_at' => $row->ultimo_mensaje_at,
            'no_leidos'         => (int) $row->no_leidos,
        ]);
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
