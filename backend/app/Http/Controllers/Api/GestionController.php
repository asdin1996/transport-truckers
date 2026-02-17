<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Gestion\StoreGestionRequest;
use App\Http\Requests\Gestion\UpdateGestionRequest;
use App\Services\GestionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class GestionController extends Controller
{
    public function __construct(private GestionService $service) {}

    public function index(int $viajeId): JsonResponse
    {
        return response()->json([
            'status'  => 'ok',
            'message' => null,
            'data'    => $this->service->porViaje($viajeId),
        ]);
    }

    public function store(StoreGestionRequest $request, int $viajeId): JsonResponse
    {
        $gestion = $this->service->crear(array_merge(
            $request->validated(),
            ['viaje_id' => $viajeId, 'user_id' => $request->user()->id]
        ));

        return response()->json([
            'status'  => 'ok',
            'message' => 'Gestión creada correctamente.',
            'data'    => $gestion->load('user:id,name'),
        ], Response::HTTP_CREATED);
    }

    public function update(UpdateGestionRequest $request, int $viajeId, int $id): JsonResponse
    {
        $gestion = $this->service->obtener($id);

        if (! $gestion || $gestion->viaje_id !== $viajeId) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Gestión no encontrada.',
                'data'    => null,
            ], Response::HTTP_NOT_FOUND);
        }

        $this->service->actualizar($id, $request->validated());

        return response()->json([
            'status'  => 'ok',
            'message' => 'Gestión actualizada correctamente.',
            'data'    => $this->service->obtener($id)->load('user:id,name'),
        ]);
    }

    public function destroy(int $viajeId, int $id): JsonResponse
    {
        $gestion = $this->service->obtener($id);

        if (! $gestion || $gestion->viaje_id !== $viajeId) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Gestión no encontrada.',
                'data'    => null,
            ], Response::HTTP_NOT_FOUND);
        }

        $this->service->eliminar($id);

        return response()->json([
            'status'  => 'ok',
            'message' => 'Gestión eliminada correctamente.',
            'data'    => null,
        ]);
    }
}
