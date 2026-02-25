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
        $tripId = $request->query('viaje_id');

        $documents = $tripId
            ? $this->service->byTrip((int) $tripId)
            : collect();

        return response()->json([
            'status' => 'ok',
            'message' => null,
            'data' => $documents,
        ]);
    }

    public function store(StoreDocumentoRequest $request): JsonResponse
    {
        $data = $request->only(['viaje_id', 'tipo', 'fecha']);
        $document = $this->service->create($data, $request->file('archivo'));

        return response()->json([
            'status' => 'ok',
            'message' => 'Documento subido correctamente.',
            'data' => $this->service->find($document->id),
        ], Response::HTTP_CREATED);
    }

    public function show(int $id): JsonResponse
    {
        $document = $this->service->find($id);

        if (! $document) {
            return response()->json([
                'status' => 'error',
                'message' => 'Documento no encontrado.',
                'data' => null,
            ], Response::HTTP_NOT_FOUND);
        }

        $user = auth()->user();
        if (! $this->service->canAccess($document, $user->camionero?->id ?? 0, $user->isAdmin())) {
            return response()->json([
                'status' => 'error',
                'message' => 'No tienes permiso para ver este documento.',
                'data' => null,
            ], Response::HTTP_FORBIDDEN);
        }

        return response()->json([
            'status' => 'ok',
            'message' => null,
            'data' => $document,
        ]);
    }

    public function update(UpdateDocumentoRequest $request, int $id): JsonResponse
    {
        $document = $this->service->find($id);

        if (! $document) {
            return response()->json([
                'status' => 'error',
                'message' => 'Documento no encontrado.',
                'data' => null,
            ], Response::HTTP_NOT_FOUND);
        }

        $user = auth()->user();
        if (! $this->service->canAccess($document, $user->camionero?->id ?? 0, $user->isAdmin())) {
            return response()->json([
                'status' => 'error',
                'message' => 'No tienes permiso para modificar este documento.',
                'data' => null,
            ], Response::HTTP_FORBIDDEN);
        }

        $data = $request->only(['tipo', 'fecha']);
        $this->service->update($id, $data, $request->file('archivo'));

        return response()->json([
            'status' => 'ok',
            'message' => 'Documento actualizado correctamente.',
            'data' => $this->service->find($id),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $document = $this->service->find($id);

        if (! $document) {
            return response()->json([
                'status' => 'error',
                'message' => 'Documento no encontrado.',
                'data' => null,
            ], Response::HTTP_NOT_FOUND);
        }

        $user = auth()->user();
        if (! $this->service->canAccess($document, $user->camionero?->id ?? 0, $user->isAdmin())) {
            return response()->json([
                'status' => 'error',
                'message' => 'No tienes permiso para eliminar este documento.',
                'data' => null,
            ], Response::HTTP_FORBIDDEN);
        }

        $this->service->delete($id);

        return response()->json([
            'status' => 'ok',
            'message' => 'Documento eliminado correctamente.',
            'data' => null,
        ]);
    }

    public function download(int $id)
    {
        $document = $this->service->find($id);

        if (! $document) {
            return response()->json([
                'status' => 'error',
                'message' => 'Documento no encontrado.',
                'data' => null,
            ], Response::HTTP_NOT_FOUND);
        }

        $user = auth()->user();
        if (! $this->service->canAccess($document, $user->camionero?->id ?? 0, $user->isAdmin())) {
            return response()->json([
                'status' => 'error',
                'message' => 'No tienes permiso para descargar este documento.',
                'data' => null,
            ], Response::HTTP_FORBIDDEN);
        }

        return $this->service->download($document);
    }
}
