<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Mensaje\StoreMensajeRequest;
use App\Services\MensajeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class MensajeController extends Controller
{
    public function __construct(private MensajeService $service) {}

    public function store(StoreMensajeRequest $request): JsonResponse
    {
        $message = $this->service->send(auth()->id(), $request->validated());

        return response()->json([
            'status'  => 'ok',
            'message' => 'Mensaje enviado correctamente.',
            'data'    => $message->load(['remitente', 'destinatario']),
        ], Response::HTTP_CREATED);
    }

    public function conversation(Request $request, int $userId): JsonResponse
    {
        $messages = $this->service->conversation(auth()->id(), $userId);

        return response()->json([
            'status'  => 'ok',
            'message' => null,
            'data'    => $messages,
        ]);
    }

    public function unread(): JsonResponse
    {
        $messages = $this->service->unread(auth()->id());

        return response()->json([
            'status'  => 'ok',
            'message' => null,
            'data'    => $messages,
        ]);
    }

    public function markAsRead(int $userId): JsonResponse
    {
        $updated = $this->service->markConversationAsRead($userId, auth()->id());

        return response()->json([
            'status'  => 'ok',
            'message' => "{$updated} mensaje(s) marcado(s) como leído(s).",
            'data'    => ['updated' => $updated],
        ]);
    }
}
