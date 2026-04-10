<?php

namespace App\Services;

use App\Models\Mensaje;
use App\Models\User;
use App\Repositories\MensajeRepository;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MensajeService extends BaseService
{
    public function __construct(MensajeRepository $repository)
    {
        parent::__construct($repository);
    }

    public function send(int $fromUserId, array $data): Mensaje
    {
        $mensaje = $this->repository->create([
            'de_user_id'   => $fromUserId,
            'para_user_id' => $data['para_user_id'],
            'contenido'    => $data['contenido'],
            'leido'        => false,
            'leido_at'     => null,
        ]);

        $this->sendPushNotification($fromUserId, $data['para_user_id'], $data['contenido']);

        return $mensaje;
    }

    private function sendPushNotification(int $fromUserId, int $toUserId, string $contenido): void
    {
        $destinatario = User::find($toUserId);
        if (! $destinatario?->push_token) {
            return;
        }

        $remitente = User::with('camionero')->find($fromUserId);
        $nombreRemitente = $remitente?->camionero
            ? "{$remitente->camionero->nombre} {$remitente->camionero->apellidos}"
            : ($remitente?->name ?? 'Alguien');

        try {
            Http::post('https://exp.host/api/v2/push/send', [
                'to'        => $destinatario->push_token,
                'title'     => "Mensaje de {$nombreRemitente}",
                'body'      => $contenido,
                'sound'     => 'default',
                'channelId' => 'mensajes',
            ]);
        } catch (\Throwable $e) {
            Log::warning('Push notification fallida: ' . $e->getMessage());
        }
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
