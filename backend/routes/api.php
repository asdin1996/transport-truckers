<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DocumentoController;
use App\Http\Controllers\Api\GastoController;
use App\Http\Controllers\Api\MensajeController;
use App\Http\Controllers\Api\UbicacionController;
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

    // Mensajes
    Route::post('mensajes', [MensajeController::class, 'store']);
    Route::get('mensajes/no-leidos', [MensajeController::class, 'noLeidos']);
    Route::get('mensajes/conversacion/{userId}', [MensajeController::class, 'conversacion']);
    Route::patch('mensajes/leidos/{userId}', [MensajeController::class, 'marcarLeidos']);

    // Ubicaciones GPS
    Route::post('ubicaciones', [UbicacionController::class, 'store']);
    Route::get('ubicaciones/camionero/{camioneroId}', [UbicacionController::class, 'ultimaPorCamionero']);
    Route::get('ubicaciones/viaje/{viajeId}', [UbicacionController::class, 'ultimaPorViaje']);
    Route::get('ubicaciones/viaje/{viajeId}/historial', [UbicacionController::class, 'historialPorViaje']);
});
