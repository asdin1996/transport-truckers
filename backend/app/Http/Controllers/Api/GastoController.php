<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Gasto\StoreGastoRequest;
use App\Http\Requests\Gasto\UpdateGastoRequest;
use App\Services\GastoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class GastoController extends Controller
{
    public function __construct(private GastoService $service) {}

    public function index(Request $request): JsonResponse
    {
        $viajeId = $request->query('viaje_id');

        $gastos = $viajeId
            ? $this->service->porViaje((int) $viajeId)
            : collect();

        return response()->json([
            'status' => 'ok',
            'message' => null,
            'data' => $gastos,
        ]);
    }

    public function store(StoreGastoRequest $request): JsonResponse
    {
        $data = $request->except('foto_ticket');
        $gasto = $this->service->crear($data, $request->file('foto_ticket'));

        return response()->json([
            'status' => 'ok',
            'message' => 'Gasto registrado correctamente.',
            'data' => $this->service->obtener($gasto->id),
        ], Response::HTTP_CREATED);
    }

    public function show(int $id): JsonResponse
    {
        $gasto = $this->service->obtener($id);

        if (! $gasto) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gasto no encontrado.',
                'data' => null,
            ], Response::HTTP_NOT_FOUND);
        }

        $user = auth()->user();
        if (! $this->service->puedeAcceder($gasto, $user->camionero?->id ?? 0, $user->isAdmin())) {
            return response()->json([
                'status' => 'error',
                'message' => 'No tienes permiso para ver este gasto.',
                'data' => null,
            ], Response::HTTP_FORBIDDEN);
        }

        return response()->json([
            'status' => 'ok',
            'message' => null,
            'data' => $gasto,
        ]);
    }

    public function update(UpdateGastoRequest $request, int $id): JsonResponse
    {
        $gasto = $this->service->obtener($id);

        if (! $gasto) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gasto no encontrado.',
                'data' => null,
            ], Response::HTTP_NOT_FOUND);
        }

        $user = auth()->user();
        if (! $this->service->puedeAcceder($gasto, $user->camionero?->id ?? 0, $user->isAdmin())) {
            return response()->json([
                'status' => 'error',
                'message' => 'No tienes permiso para modificar este gasto.',
                'data' => null,
            ], Response::HTTP_FORBIDDEN);
        }

        $data = $request->except('foto_ticket');
        $this->service->actualizar($id, $data, $request->file('foto_ticket'));

        return response()->json([
            'status' => 'ok',
            'message' => 'Gasto actualizado correctamente.',
            'data' => $this->service->obtener($id),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $gasto = $this->service->obtener($id);

        if (! $gasto) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gasto no encontrado.',
                'data' => null,
            ], Response::HTTP_NOT_FOUND);
        }

        $user = auth()->user();
        if (! $this->service->puedeAcceder($gasto, $user->camionero?->id ?? 0, $user->isAdmin())) {
            return response()->json([
                'status' => 'error',
                'message' => 'No tienes permiso para eliminar este gasto.',
                'data' => null,
            ], Response::HTTP_FORBIDDEN);
        }

        $this->service->eliminar($id);

        return response()->json([
            'status' => 'ok',
            'message' => 'Gasto eliminado correctamente.',
            'data' => null,
        ]);
    }
}
