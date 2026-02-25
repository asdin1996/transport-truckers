<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Vehiculo\StoreVehiculoRequest;
use App\Http\Requests\Vehiculo\UpdateVehiculoRequest;
use App\Services\VehiculoService;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class VehiculoController extends Controller
{
    public function __construct(private VehiculoService $service) {}

    public function index(): JsonResponse
    {
        return response()->json([
            'status' => 'ok',
            'message' => null,
            'data' => $this->service->getAll(),
        ]);
    }

    public function store(StoreVehiculoRequest $request): JsonResponse
    {
        $vehicle = $this->service->create($request->validated());

        return response()->json([
            'status' => 'ok',
            'message' => 'Vehículo creado correctamente.',
            'data' => $vehicle,
        ], Response::HTTP_CREATED);
    }

    public function show(int $id): JsonResponse
    {
        $vehicle = $this->service->find($id);

        if (! $vehicle) {
            return response()->json([
                'status' => 'error',
                'message' => 'Vehículo no encontrado.',
                'data' => null,
            ], Response::HTTP_NOT_FOUND);
        }

        return response()->json([
            'status' => 'ok',
            'message' => null,
            'data' => $vehicle,
        ]);
    }

    public function update(UpdateVehiculoRequest $request, int $id): JsonResponse
    {
        $vehicle = $this->service->find($id);

        if (! $vehicle) {
            return response()->json([
                'status' => 'error',
                'message' => 'Vehículo no encontrado.',
                'data' => null,
            ], Response::HTTP_NOT_FOUND);
        }

        $this->service->update($id, $request->validated());

        return response()->json([
            'status' => 'ok',
            'message' => 'Vehículo actualizado correctamente.',
            'data' => $this->service->find($id),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $vehicle = $this->service->find($id);

        if (! $vehicle) {
            return response()->json([
                'status' => 'error',
                'message' => 'Vehículo no encontrado.',
                'data' => null,
            ], Response::HTTP_NOT_FOUND);
        }

        $this->service->delete($id);

        return response()->json([
            'status' => 'ok',
            'message' => 'Vehículo eliminado correctamente.',
            'data' => null,
        ]);
    }
}
