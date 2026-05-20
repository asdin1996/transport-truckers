<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Imports\ParadasImport;
use App\Models\Parada;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

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
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:2048',
        ]);

        $import = new ParadasImport();
        Excel::import($import, $request->file('file'));

        return response()->json([
            'status'  => 'ok',
            'data'    => null,
            'message' => "{$import->importadas} paradas importadas.",
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $parada = Parada::findOrFail($id);

        $data = $request->validate([
            'nombre' => 'required|string|max:255|unique:paradas,nombre,' . $id,
            'lat'    => 'nullable|numeric|between:-90,90',
            'lng'    => 'nullable|numeric|between:-180,180',
        ]);

        $parada->update($data);

        return response()->json(['status' => 'ok', 'data' => $parada, 'message' => 'Parada actualizada.']);
    }

    public function destroy(int $id): JsonResponse
    {
        $parada = Parada::findOrFail($id);
        $parada->delete();

        return response()->json(['status' => 'ok', 'data' => null, 'message' => 'Parada eliminada.']);
    }
}
