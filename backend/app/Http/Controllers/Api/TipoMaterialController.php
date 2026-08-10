<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Imports\TiposMaterialImport;
use App\Models\TipoMaterial;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class TipoMaterialController extends Controller
{
    public function index(): JsonResponse
    {
        $tipos = TipoMaterial::orderBy('nombre')->get();

        return response()->json(['status' => 'ok', 'data' => $tipos, 'message' => null]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nombre' => 'required|string|max:255|unique:tipos_material,nombre',
        ]);

        $tipo = TipoMaterial::create($data);

        return response()->json(['status' => 'ok', 'data' => $tipo, 'message' => 'Tipo de material creado.'], 201);
    }

    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:2048',
        ]);

        $import = new TiposMaterialImport();
        Excel::import($import, $request->file('file'));

        return response()->json([
            'status'  => 'ok',
            'data'    => null,
            'message' => "{$import->importados} tipos de material importados.",
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $tipo = TipoMaterial::findOrFail($id);

        $data = $request->validate([
            'nombre' => 'required|string|max:255|unique:tipos_material,nombre,' . $id,
        ]);

        $tipo->update($data);

        return response()->json(['status' => 'ok', 'data' => $tipo, 'message' => 'Tipo de material actualizado.']);
    }

    public function destroy(int $id): JsonResponse
    {
        $tipo = TipoMaterial::findOrFail($id);
        $tipo->delete();

        return response()->json(['status' => 'ok', 'data' => null, 'message' => 'Tipo de material eliminado.']);
    }
}
