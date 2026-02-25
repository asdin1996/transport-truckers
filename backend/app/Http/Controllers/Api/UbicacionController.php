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

        $location = $this->service->register($user->camionero->id, $request->validated());

        return response()->json([
            'status'  => 'ok',
            'message' => 'Ubicación registrada correctamente.',
            'data'    => $location,
        ], Response::HTTP_CREATED);
    }

    public function latestByDriver(int $driverId): JsonResponse
    {
        $location = $this->service->latestByDriver($driverId);

        if (! $location) {
            return response()->json([
                'status'  => 'error',
                'message' => 'No hay ubicaciones registradas para este camionero.',
                'data'    => null,
            ], Response::HTTP_NOT_FOUND);
        }

        return response()->json([
            'status'  => 'ok',
            'message' => null,
            'data'    => $location,
        ]);
    }

    public function latestByTrip(int $tripId): JsonResponse
    {
        $location = $this->service->latestByTrip($tripId);

        if (! $location) {
            return response()->json([
                'status'  => 'error',
                'message' => 'No hay ubicaciones registradas para este viaje.',
                'data'    => null,
            ], Response::HTTP_NOT_FOUND);
        }

        return response()->json([
            'status'  => 'ok',
            'message' => null,
            'data'    => $location,
        ]);
    }

    public function historyByTrip(int $tripId): JsonResponse
    {
        $locations = $this->service->historyByTrip($tripId);

        return response()->json([
            'status'  => 'ok',
            'message' => null,
            'data'    => $locations,
        ]);
    }
}
