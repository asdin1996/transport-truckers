<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Almacen;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AlmacenController extends Controller
{
    public function index(): JsonResponse
    {
        $almacenes = Almacen::orderBy('nombre')->get();

        return response()->json(['status' => 'ok', 'data' => $almacenes, 'message' => null]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nombre' => 'required|string|max:255|unique:almacenes,nombre',
        ]);

        $almacen = Almacen::create($data);

        return response()->json(['status' => 'ok', 'data' => $almacen, 'message' => 'Almacén creado.'], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $almacen = Almacen::findOrFail($id);

        $data = $request->validate([
            'nombre' => 'required|string|max:255|unique:almacenes,nombre,' . $id,
        ]);

        $almacen->update($data);

        return response()->json(['status' => 'ok', 'data' => $almacen, 'message' => 'Almacén actualizado.']);
    }

    public function destroy(int $id): JsonResponse
    {
        $almacen = Almacen::findOrFail($id);
        $almacen->delete();

        return response()->json(['status' => 'ok', 'data' => null, 'message' => 'Almacén eliminado.']);
    }
}
