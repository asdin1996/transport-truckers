<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Documento\StoreDocumentoRequest;
use App\Http\Requests\Documento\UpdateDocumentoRequest;
use App\Services\DocumentoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class DocumentoController extends Controller
{
    public function __construct(private DocumentoService $service) {}

    public function index(Request $request): JsonResponse
    {
        $viajeId = $request->query('viaje_id');

        $documentos = $viajeId
            ? $this->service->porViaje((int) $viajeId)
            : collect();

        return response()->json([
            'status' => 'ok',
            'message' => null,
            'data' => $documentos,
        ]);
    }

    public function store(StoreDocumentoRequest $request): JsonResponse
    {
        $data = $request->only(['viaje_id', 'tipo', 'fecha']);
        $documento = $this->service->crear($data, $request->file('archivo'));

        return response()->json([
            'status' => 'ok',
            'message' => 'Documento subido correctamente.',
            'data' => $this->service->obtener($documento->id),
        ], Response::HTTP_CREATED);
    }

    public function show(int $id): JsonResponse
    {
        $documento = $this->service->obtener($id);

        if (! $documento) {
            return response()->json([
                'status' => 'error',
                'message' => 'Documento no encontrado.',
                'data' => null,
            ], Response::HTTP_NOT_FOUND);
        }

        $user = auth()->user();
        if (! $this->service->puedeAcceder($documento, $user->camionero?->id ?? 0, $user->isAdmin())) {
            return response()->json([
                'status' => 'error',
                'message' => 'No tienes permiso para ver este documento.',
                'data' => null,
            ], Response::HTTP_FORBIDDEN);
        }

        return response()->json([
            'status' => 'ok',
            'message' => null,
            'data' => $documento,
        ]);
    }

    public function update(UpdateDocumentoRequest $request, int $id): JsonResponse
    {
        $documento = $this->service->obtener($id);

        if (! $documento) {
            return response()->json([
                'status' => 'error',
                'message' => 'Documento no encontrado.',
                'data' => null,
            ], Response::HTTP_NOT_FOUND);
        }

        $user = auth()->user();
        if (! $this->service->puedeAcceder($documento, $user->camionero?->id ?? 0, $user->isAdmin())) {
            return response()->json([
                'status' => 'error',
                'message' => 'No tienes permiso para modificar este documento.',
                'data' => null,
            ], Response::HTTP_FORBIDDEN);
        }

        $data = $request->only(['tipo', 'fecha']);
        $this->service->actualizar($id, $data, $request->file('archivo'));

        return response()->json([
            'status' => 'ok',
            'message' => 'Documento actualizado correctamente.',
            'data' => $this->service->obtener($id),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $documento = $this->service->obtener($id);

        if (! $documento) {
            return response()->json([
                'status' => 'error',
                'message' => 'Documento no encontrado.',
                'data' => null,
            ], Response::HTTP_NOT_FOUND);
        }

        $user = auth()->user();
        if (! $this->service->puedeAcceder($documento, $user->camionero?->id ?? 0, $user->isAdmin())) {
            return response()->json([
                'status' => 'error',
                'message' => 'No tienes permiso para eliminar este documento.',
                'data' => null,
            ], Response::HTTP_FORBIDDEN);
        }

        $this->service->eliminar($id);

        return response()->json([
            'status' => 'ok',
            'message' => 'Documento eliminado correctamente.',
            'data' => null,
        ]);
    }

    public function descargar(int $id)
    {
        $documento = $this->service->obtener($id);

        if (! $documento) {
            return response()->json([
                'status' => 'error',
                'message' => 'Documento no encontrado.',
                'data' => null,
            ], Response::HTTP_NOT_FOUND);
        }

        $user = auth()->user();
        if (! $this->service->puedeAcceder($documento, $user->camionero?->id ?? 0, $user->isAdmin())) {
            return response()->json([
                'status' => 'error',
                'message' => 'No tienes permiso para descargar este documento.',
                'data' => null,
            ], Response::HTTP_FORBIDDEN);
        }

        return $this->service->descargar($documento);
    }
}
