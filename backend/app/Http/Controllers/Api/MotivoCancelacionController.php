<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MotivoCancelacion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MotivoCancelacionController extends Controller
{
    public function index(): JsonResponse
    {
        $motivos = MotivoCancelacion::orderBy('nombre')->get();

        return response()->json(['status' => 'ok', 'data' => $motivos, 'message' => null]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nombre' => 'required|string|max:255|unique:motivos_cancelacion,nombre',
        ]);

        $motivo = MotivoCancelacion::create($data);

        return response()->json(['status' => 'ok', 'data' => $motivo, 'message' => 'Motivo de cancelación creado.'], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $motivo = MotivoCancelacion::findOrFail($id);

        $data = $request->validate([
            'nombre' => 'required|string|max:255|unique:motivos_cancelacion,nombre,' . $id,
        ]);

        $motivo->update($data);

        return response()->json(['status' => 'ok', 'data' => $motivo, 'message' => 'Motivo de cancelación actualizado.']);
    }

    public function destroy(int $id): JsonResponse
    {
        $motivo = MotivoCancelacion::findOrFail($id);
        $motivo->delete();

        return response()->json(['status' => 'ok', 'data' => null, 'message' => 'Motivo de cancelación eliminado.']);
    }
}
