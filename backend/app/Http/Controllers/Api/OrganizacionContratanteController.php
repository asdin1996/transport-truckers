<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OrganizacionContratante;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrganizacionContratanteController extends Controller
{
    public function index(): JsonResponse
    {
        $orgs = OrganizacionContratante::orderBy('nombre')->get();

        return response()->json(['status' => 'ok', 'data' => $orgs, 'message' => null]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nombre' => 'required|string|max:255|unique:organizaciones_contratantes,nombre',
        ]);

        $org = OrganizacionContratante::create($data);

        return response()->json(['status' => 'ok', 'data' => $org, 'message' => 'Organización contratante creada.'], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $org = OrganizacionContratante::findOrFail($id);

        $data = $request->validate([
            'nombre' => 'required|string|max:255|unique:organizaciones_contratantes,nombre,' . $id,
        ]);

        $org->update($data);

        return response()->json(['status' => 'ok', 'data' => $org, 'message' => 'Organización contratante actualizada.']);
    }

    public function destroy(int $id): JsonResponse
    {
        $org = OrganizacionContratante::findOrFail($id);
        $org->delete();

        return response()->json(['status' => 'ok', 'data' => null, 'message' => 'Organización contratante eliminada.']);
    }
}
