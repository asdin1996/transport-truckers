<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DocumentoController;
use App\Http\Controllers\Api\GastoController;
use App\Http\Controllers\Api\RutaController;
use App\Http\Controllers\Api\VehiculoController;
use App\Http\Controllers\Api\ViajeController;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json(['status' => 'ok', 'message' => 'API funcionando']);
});

// Autenticación
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Vehículos — admin y camionero pueden acceder
    Route::apiResource('vehiculos', VehiculoController::class);

    // Rutas — admin y camionero pueden acceder
    Route::apiResource('rutas', RutaController::class);

    // Viajes
    Route::apiResource('viajes', ViajeController::class);
    Route::patch('viajes/{id}/estado', [ViajeController::class, 'cambiarEstado']);

    // Gastos
    Route::apiResource('gastos', GastoController::class);

    // Documentos
    Route::apiResource('documentos', DocumentoController::class);
    Route::get('documentos/{id}/descargar', [DocumentoController::class, 'descargar']);
});
