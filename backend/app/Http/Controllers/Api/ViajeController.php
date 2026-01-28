<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Viaje\CambiarEstadoRequest;
use App\Http\Requests\Viaje\StoreViajeRequest;
use App\Http\Requests\Viaje\UpdateViajeRequest;
use App\Services\ViajeService;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class ViajeController extends Controller
{
    public function __construct(private ViajeService $service) {}

    public function index(): JsonResponse
    {
        return response()->json([
            'status' => 'ok',
            'message' => null,
            'data' => $this->service->listar(),
        ]);
    }

    public function store(StoreViajeRequest $request): JsonResponse
    {
        $viaje = $this->service->crear($request->validated());

        return response()->json([
            'status' => 'ok',
            'message' => 'Viaje creado correctamente.',
            'data' => $this->service->obtener($viaje->id),
        ], Response::HTTP_CREATED);
    }

    public function show(int $id): JsonResponse
    {
        $viaje = $this->service->obtener($id);

        if (! $viaje) {
            return response()->json([
                'status' => 'error',
                'message' => 'Viaje no encontrado.',
                'data' => null,
            ], Response::HTTP_NOT_FOUND);
        }

        if (! $this->service->puedeAcceder($viaje)) {
            return response()->json([
                'status' => 'error',
                'message' => 'No tienes permiso para ver este viaje.',
                'data' => null,
            ], Response::HTTP_FORBIDDEN);
        }

        return response()->json([
            'status' => 'ok',
            'message' => null,
            'data' => $viaje,
        ]);
    }

    public function update(UpdateViajeRequest $request, int $id): JsonResponse
    {
        $viaje = $this->service->obtener($id);

        if (! $viaje) {
            return response()->json([
                'status' => 'error',
                'message' => 'Viaje no encontrado.',
                'data' => null,
            ], Response::HTTP_NOT_FOUND);
        }

        if (! $this->service->puedeAcceder($viaje)) {
            return response()->json([
                'status' => 'error',
                'message' => 'No tienes permiso para modificar este viaje.',
                'data' => null,
            ], Response::HTTP_FORBIDDEN);
        }

        $this->service->actualizar($id, $request->validated());

        return response()->json([
            'status' => 'ok',
            'message' => 'Viaje actualizado correctamente.',
            'data' => $this->service->obtener($id),
        ]);
    }

    public function cambiarEstado(CambiarEstadoRequest $request, int $id): JsonResponse
    {
        $viaje = $this->service->obtener($id);

        if (! $viaje) {
            return response()->json([
                'status' => 'error',
                'message' => 'Viaje no encontrado.',
                'data' => null,
            ], Response::HTTP_NOT_FOUND);
        }

        if (! $this->service->puedeAcceder($viaje)) {
            return response()->json([
                'status' => 'error',
                'message' => 'No tienes permiso para modificar este viaje.',
                'data' => null,
            ], Response::HTTP_FORBIDDEN);
        }

        $this->service->cambiarEstado($viaje, $request->validated()['estado']);

        return response()->json([
            'status' => 'ok',
            'message' => 'Estado del viaje actualizado.',
            'data' => $this->service->obtener($id),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $viaje = $this->service->obtener($id);

        if (! $viaje) {
            return response()->json([
                'status' => 'error',
                'message' => 'Viaje no encontrado.',
                'data' => null,
            ], Response::HTTP_NOT_FOUND);
        }

        $this->service->eliminar($id);

        return response()->json([
            'status' => 'ok',
            'message' => 'Viaje eliminado correctamente.',
            'data' => null,
        ]);
    }
}
