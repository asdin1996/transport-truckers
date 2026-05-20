<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Configuracion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConfiguracionController extends Controller
{
    public function show(string $clave): JsonResponse
    {
        return response()->json([
            'status' => 'ok',
            'data'   => ['clave' => $clave, 'valor' => Configuracion::get($clave)],
        ]);
    }

    public function update(Request $request, string $clave): JsonResponse
    {
        $request->validate(['valor' => 'nullable|string|max:1000']);

        Configuracion::set($clave, $request->input('valor'));

        return response()->json([
            'status'  => 'ok',
            'message' => 'Configuración actualizada.',
            'data'    => ['clave' => $clave, 'valor' => $request->input('valor')],
        ]);
    }
}
