<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\MaponService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MaponController extends Controller
{
    public function __construct(private MaponService $service) {}

    public function units(): JsonResponse
    {
        try {
            return response()->json([
                'status' => 'ok',
                'data'   => $this->service->getUnits(),
            ]);
        } catch (\RuntimeException $e) {
            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage(),
            ], 503);
        }
    }

    public function syncVehiculos(Request $request): JsonResponse
    {
        try {
            $limpiar = (bool) $request->input('limpiar', false);
            $stats   = $this->service->syncVehiculos($limpiar);
            return response()->json(['status' => 'ok', 'data' => $stats]);
        } catch (\RuntimeException $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 503);
        }
    }

    public function syncCamioneros(): JsonResponse
    {
        try {
            $stats = $this->service->syncCamioneros();
            return response()->json(['status' => 'ok', 'data' => $stats]);
        } catch (\RuntimeException $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 503);
        }
    }

    public function syncZonas(): JsonResponse
    {
        try {
            $stats = $this->service->syncZonas();
            return response()->json(['status' => 'ok', 'data' => $stats]);
        } catch (\RuntimeException $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 503);
        }
    }

    public function dashboard(): JsonResponse
    {
        try {
            return response()->json([
                'status' => 'ok',
                'data'   => $this->service->getDashboard(),
            ]);
        } catch (\RuntimeException $e) {
            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage(),
            ], 503);
        }
    }
}
