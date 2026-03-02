<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Viaje\CambiarEstadoRequest;
use App\Http\Requests\Viaje\StoreViajeRequest;
use App\Http\Requests\Viaje\UpdateViajeRequest;
use App\Services\ViajeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ViajeController extends Controller
{
    public function __construct(private ViajeService $service) {}

    public function index(): JsonResponse
    {
        return response()->json([
            'status' => 'ok',
            'message' => null,
            'data' => $this->service->getAll(),
        ]);
    }

    public function store(StoreViajeRequest $request): JsonResponse
    {
        $trip = $this->service->create($request->validated());

        return response()->json([
            'status' => 'ok',
            'message' => 'Viaje creado correctamente.',
            'data' => $this->service->find($trip->id),
        ], Response::HTTP_CREATED);
    }

    public function show(int $id): JsonResponse
    {
        $trip = $this->service->find($id);

        if (! $trip) {
            return response()->json([
                'status' => 'error',
                'message' => 'Viaje no encontrado.',
                'data' => null,
            ], Response::HTTP_NOT_FOUND);
        }

        if (! $this->service->canAccess($trip)) {
            return response()->json([
                'status' => 'error',
                'message' => 'No tienes permiso para ver este viaje.',
                'data' => null,
            ], Response::HTTP_FORBIDDEN);
        }

        return response()->json([
            'status' => 'ok',
            'message' => null,
            'data' => $trip,
        ]);
    }

    public function update(UpdateViajeRequest $request, int $id): JsonResponse
    {
        $trip = $this->service->find($id);

        if (! $trip) {
            return response()->json([
                'status' => 'error',
                'message' => 'Viaje no encontrado.',
                'data' => null,
            ], Response::HTTP_NOT_FOUND);
        }

        if (! $this->service->canAccess($trip)) {
            return response()->json([
                'status' => 'error',
                'message' => 'No tienes permiso para modificar este viaje.',
                'data' => null,
            ], Response::HTTP_FORBIDDEN);
        }

        $this->service->update($id, $request->validated());

        return response()->json([
            'status' => 'ok',
            'message' => 'Viaje actualizado correctamente.',
            'data' => $this->service->find($id),
        ]);
    }

    public function changeStatus(CambiarEstadoRequest $request, int $id): JsonResponse
    {
        $trip = $this->service->find($id);

        if (! $trip) {
            return response()->json([
                'status' => 'error',
                'message' => 'Viaje no encontrado.',
                'data' => null,
            ], Response::HTTP_NOT_FOUND);
        }

        if (! $this->service->canAccess($trip)) {
            return response()->json([
                'status' => 'error',
                'message' => 'No tienes permiso para modificar este viaje.',
                'data' => null,
            ], Response::HTTP_FORBIDDEN);
        }

        $this->service->changeStatus($trip, $request->validated()['estado']);

        return response()->json([
            'status' => 'ok',
            'message' => 'Estado del viaje actualizado.',
            'data' => $this->service->find($id),
        ]);
    }

    public function updateParadas(Request $request, int $id): JsonResponse
    {
        $trip = $this->service->find($id);

        if (! $trip) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Viaje no encontrado.',
                'data'    => null,
            ], Response::HTTP_NOT_FOUND);
        }

        if (! $this->service->canAccess($trip)) {
            return response()->json([
                'status'  => 'error',
                'message' => 'No tienes permiso para modificar este viaje.',
                'data'    => null,
            ], Response::HTTP_FORBIDDEN);
        }

        $validated = $request->validate([
            'paradas_completadas'   => ['present', 'array'],
            'paradas_completadas.*' => ['integer', 'min:0'],
        ]);

        $this->service->update($trip->id, ['paradas_completadas' => $validated['paradas_completadas']]);

        return response()->json([
            'status'  => 'ok',
            'message' => null,
            'data'    => $this->service->find($id),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $trip = $this->service->find($id);

        if (! $trip) {
            return response()->json([
                'status' => 'error',
                'message' => 'Viaje no encontrado.',
                'data' => null,
            ], Response::HTTP_NOT_FOUND);
        }

        $this->service->delete($id);

        return response()->json([
            'status' => 'ok',
            'message' => 'Viaje eliminado correctamente.',
            'data' => null,
        ]);
    }
}
