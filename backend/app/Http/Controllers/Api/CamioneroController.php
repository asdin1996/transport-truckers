<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Camionero\StoreCamioneroRequest;
use App\Http\Requests\Camionero\UpdateCamioneroRequest;
use App\Services\CamioneroService;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class CamioneroController extends Controller
{
    public function __construct(private CamioneroService $service) {}

    public function index(): JsonResponse
    {
        return response()->json([
            'status'  => 'ok',
            'message' => null,
            'data'    => $this->service->listar(),
        ]);
    }

    public function store(StoreCamioneroRequest $request): JsonResponse
    {
        $camionero = $this->service->crear($request->validated());

        return response()->json([
            'status'  => 'ok',
            'message' => 'Camionero creado correctamente.',
            'data'    => $camionero,
        ], Response::HTTP_CREATED);
    }

    public function show(int $id): JsonResponse
    {
        $camionero = $this->service->obtener($id);

        if (! $camionero) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Camionero no encontrado.',
                'data'    => null,
            ], Response::HTTP_NOT_FOUND);
        }

        return response()->json([
            'status'  => 'ok',
            'message' => null,
            'data'    => $camionero,
        ]);
    }

    public function update(UpdateCamioneroRequest $request, int $id): JsonResponse
    {
        $camionero = $this->service->obtener($id);

        if (! $camionero) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Camionero no encontrado.',
                'data'    => null,
            ], Response::HTTP_NOT_FOUND);
        }

        $this->service->actualizar($id, $request->validated());

        return response()->json([
            'status'  => 'ok',
            'message' => 'Camionero actualizado correctamente.',
            'data'    => $this->service->obtener($id),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $camionero = $this->service->obtener($id);

        if (! $camionero) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Camionero no encontrado.',
                'data'    => null,
            ], Response::HTTP_NOT_FOUND);
        }

        $this->service->eliminar($id);

        return response()->json([
            'status'  => 'ok',
            'message' => 'Camionero eliminado correctamente.',
            'data'    => null,
        ]);
    }
}
