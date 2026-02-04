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
        $mensaje = $this->service->enviar(auth()->id(), $request->validated());

        return response()->json([
            'status'  => 'ok',
            'message' => 'Mensaje enviado correctamente.',
            'data'    => $mensaje->load(['remitente', 'destinatario']),
        ], Response::HTTP_CREATED);
    }

    public function conversacion(Request $request, int $userId): JsonResponse
    {
        $mensajes = $this->service->conversacion(auth()->id(), $userId);

        return response()->json([
            'status'  => 'ok',
            'message' => null,
            'data'    => $mensajes,
        ]);
    }

    public function noLeidos(): JsonResponse
    {
        $mensajes = $this->service->noLeidos(auth()->id());

        return response()->json([
            'status'  => 'ok',
            'message' => null,
            'data'    => $mensajes,
        ]);
    }

    public function marcarLeidos(int $userId): JsonResponse
    {
        $actualizados = $this->service->marcarLeidosEnConversacion($userId, auth()->id());

        return response()->json([
            'status'  => 'ok',
            'message' => "{$actualizados} mensaje(s) marcado(s) como leído(s).",
            'data'    => ['actualizados' => $actualizados],
        ]);
    }
}
