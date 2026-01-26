<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Ruta\StoreRutaRequest;
use App\Http\Requests\Ruta\UpdateRutaRequest;
use App\Services\RutaService;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class RutaController extends Controller
{
    public function __construct(private RutaService $service) {}

    public function index(): JsonResponse
    {
        return response()->json([
            'status' => 'ok',
            'message' => null,
            'data' => $this->service->listar(),
        ]);
    }

    public function store(StoreRutaRequest $request): JsonResponse
    {
        $ruta = $this->service->crear($request->validated());

        return response()->json([
            'status' => 'ok',
            'message' => 'Ruta creada correctamente.',
            'data' => $ruta,
        ], Response::HTTP_CREATED);
    }

    public function show(int $id): JsonResponse
    {
        $ruta = $this->service->obtener($id);

        if (! $ruta) {
            return response()->json([
                'status' => 'error',
                'message' => 'Ruta no encontrada.',
                'data' => null,
            ], Response::HTTP_NOT_FOUND);
        }

        return response()->json([
            'status' => 'ok',
            'message' => null,
            'data' => $ruta,
        ]);
    }

    public function update(UpdateRutaRequest $request, int $id): JsonResponse
    {
        $ruta = $this->service->obtener($id);

        if (! $ruta) {
            return response()->json([
                'status' => 'error',
                'message' => 'Ruta no encontrada.',
                'data' => null,
            ], Response::HTTP_NOT_FOUND);
        }

        $this->service->actualizar($id, $request->validated());

        return response()->json([
            'status' => 'ok',
            'message' => 'Ruta actualizada correctamente.',
            'data' => $this->service->obtener($id),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $ruta = $this->service->obtener($id);

        if (! $ruta) {
            return response()->json([
                'status' => 'error',
                'message' => 'Ruta no encontrada.',
                'data' => null,
            ], Response::HTTP_NOT_FOUND);
        }

        $this->service->eliminar($id);

        return response()->json([
            'status' => 'ok',
            'message' => 'Ruta eliminada correctamente.',
            'data' => null,
        ]);
    }
}
