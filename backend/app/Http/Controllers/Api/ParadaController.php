<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Parada;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ParadaController extends Controller
{
    public function index(): JsonResponse
    {
        $paradas = Parada::orderBy('nombre')->get();

        return response()->json(['status' => 'ok', 'data' => $paradas, 'message' => null]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate(['nombre' => 'required|string|max:255|unique:paradas,nombre']);

        $parada = Parada::create($data);

        return response()->json(['status' => 'ok', 'data' => $parada, 'message' => 'Parada creada.'], 201);
    }

    public function import(Request $request): JsonResponse
    {
        $request->validate(['paradas' => 'required|array', 'paradas.*' => 'required|string|max:255']);

        $creadas = 0;
        foreach ($request->paradas as $nombre) {
            $nombre = trim($nombre);
            if ($nombre && ! Parada::withTrashed()->where('nombre', $nombre)->exists()) {
                Parada::create(['nombre' => $nombre]);
                $creadas++;
            }
        }

        return response()->json(['status' => 'ok', 'data' => null, 'message' => "{$creadas} paradas importadas."]);
    }

    public function destroy(int $id): JsonResponse
    {
        $parada = Parada::findOrFail($id);
        $parada->delete();

        return response()->json(['status' => 'ok', 'data' => null, 'message' => 'Parada eliminada.']);
    }
}
