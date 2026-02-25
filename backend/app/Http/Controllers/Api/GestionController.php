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

    public function index(int $tripId): JsonResponse
    {
        return response()->json([
            'status'  => 'ok',
            'message' => null,
            'data'    => $this->service->byTrip($tripId),
        ]);
    }

    public function store(StoreGestionRequest $request, int $tripId): JsonResponse
    {
        $record = $this->service->create(array_merge(
            $request->validated(),
            ['viaje_id' => $tripId, 'user_id' => $request->user()->id]
        ));

        return response()->json([
            'status'  => 'ok',
            'message' => 'Gestión creada correctamente.',
            'data'    => $record->load('user:id,name'),
        ], Response::HTTP_CREATED);
    }

    public function update(UpdateGestionRequest $request, int $tripId, int $id): JsonResponse
    {
        $record = $this->service->find($id);

        if (! $record || $record->viaje_id !== $tripId) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Gestión no encontrada.',
                'data'    => null,
            ], Response::HTTP_NOT_FOUND);
        }

        $this->service->update($id, $request->validated());

        return response()->json([
            'status'  => 'ok',
            'message' => 'Gestión actualizada correctamente.',
            'data'    => $this->service->find($id)->load('user:id,name'),
        ]);
    }

    public function destroy(int $tripId, int $id): JsonResponse
    {
        $record = $this->service->find($id);

        if (! $record || $record->viaje_id !== $tripId) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Gestión no encontrada.',
                'data'    => null,
            ], Response::HTTP_NOT_FOUND);
        }

        $this->service->delete($id);

        return response()->json([
            'status'  => 'ok',
            'message' => 'Gestión eliminada correctamente.',
            'data'    => null,
        ]);
    }
}
