<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Ubicacion\StoreUbicacionRequest;
use App\Services\UbicacionService;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class UbicacionController extends Controller
{
    public function __construct(private UbicacionService $service) {}

    public function store(StoreUbicacionRequest $request): JsonResponse
    {
        $user = auth()->user();

        if (! $user->camionero) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Solo los camioneros pueden registrar ubicaciones.',
                'data'    => null,
            ], Response::HTTP_FORBIDDEN);
        }

        $ubicacion = $this->service->registrar($user->camionero->id, $request->validated());

        return response()->json([
            'status'  => 'ok',
            'message' => 'Ubicación registrada correctamente.',
            'data'    => $ubicacion,
        ], Response::HTTP_CREATED);
    }

    public function ultimaPorCamionero(int $camioneroId): JsonResponse
    {
        $ubicacion = $this->service->ultimaPorCamionero($camioneroId);

        if (! $ubicacion) {
            return response()->json([
                'status'  => 'error',
                'message' => 'No hay ubicaciones registradas para este camionero.',
                'data'    => null,
            ], Response::HTTP_NOT_FOUND);
        }

        return response()->json([
            'status'  => 'ok',
            'message' => null,
            'data'    => $ubicacion,
        ]);
    }

    public function ultimaPorViaje(int $viajeId): JsonResponse
    {
        $ubicacion = $this->service->ultimaPorViaje($viajeId);

        if (! $ubicacion) {
            return response()->json([
                'status'  => 'error',
                'message' => 'No hay ubicaciones registradas para este viaje.',
                'data'    => null,
            ], Response::HTTP_NOT_FOUND);
        }

        return response()->json([
            'status'  => 'ok',
            'message' => null,
            'data'    => $ubicacion,
        ]);
    }

    public function historialPorViaje(int $viajeId): JsonResponse
    {
        $ubicaciones = $this->service->historialPorViaje($viajeId);

        return response()->json([
            'status'  => 'ok',
            'message' => null,
            'data'    => $ubicaciones,
        ]);
    }
}
