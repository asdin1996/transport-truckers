<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CamioneroController;
use App\Http\Controllers\Api\ConfiguracionController;
use App\Http\Controllers\Api\DocumentoController;
use App\Http\Controllers\Api\MaponController;
use App\Http\Controllers\Api\GastoController;
use App\Http\Controllers\Api\GestionController;
use App\Http\Controllers\Api\MensajeController;
use App\Http\Controllers\Api\UbicacionController;
use App\Http\Controllers\Api\AlmacenController;
use App\Http\Controllers\Api\GestorController;
use App\Http\Controllers\Api\ParadaController;
use App\Http\Controllers\Api\TipoMaterialController;
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
    Route::post('/push-token', [AuthController::class, 'savePushToken']);
    Route::get('/admin-contact', [AuthController::class, 'adminContact']);
    Route::get('/contactos', [AuthController::class, 'contactos']);

    // Camioneros — solo admin
    Route::apiResource('camioneros', CamioneroController::class);

    // Vehículos — admin y camionero pueden acceder
    Route::apiResource('vehiculos', VehiculoController::class);

    // Almacenes (configuración)
    Route::get('almacenes', [AlmacenController::class, 'index']);
    Route::post('almacenes', [AlmacenController::class, 'store']);
    Route::put('almacenes/{id}', [AlmacenController::class, 'update']);
    Route::delete('almacenes/{id}', [AlmacenController::class, 'destroy']);

    // Gestión de usuarios admin/gestor (solo admin)
    Route::get('gestores', [GestorController::class, 'index']);
    Route::post('gestores', [GestorController::class, 'store']);
    Route::put('gestores/{id}', [GestorController::class, 'update']);
    Route::delete('gestores/{id}', [GestorController::class, 'destroy']);

    // Paradas (configuración)
    Route::get('paradas', [ParadaController::class, 'index']);
    Route::post('paradas', [ParadaController::class, 'store']);
    Route::post('paradas/import', [ParadaController::class, 'import']);
    Route::put('paradas/{id}', [ParadaController::class, 'update']);
    Route::delete('paradas/{id}', [ParadaController::class, 'destroy']);

    // Tipos de material (configuración)
    Route::get('tipos-material', [TipoMaterialController::class, 'index']);
    Route::post('tipos-material', [TipoMaterialController::class, 'store']);
    Route::post('tipos-material/import', [TipoMaterialController::class, 'import']);
    Route::put('tipos-material/{id}', [TipoMaterialController::class, 'update']);
    Route::delete('tipos-material/{id}', [TipoMaterialController::class, 'destroy']);

    // Viajes
    Route::apiResource('viajes', ViajeController::class);
    Route::patch('viajes/{id}/estado', [ViajeController::class, 'changeStatus']);
    Route::patch('viajes/{id}/paradas', [ViajeController::class, 'updateParadas']);

    // Gestiones (notas/comentarios de un viaje)
    Route::get('viajes/{tripId}/gestiones', [GestionController::class, 'index']);
    Route::post('viajes/{tripId}/gestiones', [GestionController::class, 'store']);
    Route::patch('viajes/{tripId}/gestiones/{id}', [GestionController::class, 'update']);
    Route::delete('viajes/{tripId}/gestiones/{id}', [GestionController::class, 'destroy']);

    // Gastos
    Route::apiResource('gastos', GastoController::class);

    // Documentos
    Route::apiResource('documentos', DocumentoController::class);
    Route::get('documentos/{id}/descargar', [DocumentoController::class, 'download']);

    // Mensajes
    Route::post('mensajes', [MensajeController::class, 'store']);
    Route::get('mensajes/resumen', [MensajeController::class, 'resumen']);
    Route::get('mensajes/no-leidos', [MensajeController::class, 'unread']);
    Route::get('mensajes/conversacion/{userId}', [MensajeController::class, 'conversation']);
    Route::patch('mensajes/leidos/{userId}', [MensajeController::class, 'markAsRead']);

    // Ubicaciones GPS
    Route::post('ubicaciones', [UbicacionController::class, 'store']);
    Route::get('ubicaciones/camionero/{driverId}', [UbicacionController::class, 'latestByDriver']);
    Route::get('ubicaciones/viaje/{tripId}', [UbicacionController::class, 'latestByTrip']);
    Route::get('ubicaciones/viaje/{tripId}/historial', [UbicacionController::class, 'historyByTrip']);

    // Mapon GPS (accesible por admin y maps)
    Route::get('mapon/units', [MaponController::class, 'units'])
        ->middleware('role:admin,maps');
    Route::get('mapon/dashboard', [MaponController::class, 'dashboard'])
        ->middleware('role:admin,maps');
    Route::post('mapon/sync/vehiculos', [MaponController::class, 'syncVehiculos'])
        ->middleware('role:admin');
    Route::post('mapon/sync/camioneros', [MaponController::class, 'syncCamioneros'])
        ->middleware('role:admin');
    Route::post('mapon/sync/zonas', [MaponController::class, 'syncZonas'])
        ->middleware('role:admin');

    // Configuración (solo admin)
    Route::middleware('role:admin')->group(function () {
        Route::get('configuracion/{clave}', [ConfiguracionController::class, 'show']);
        Route::put('configuracion/{clave}', [ConfiguracionController::class, 'update']);
    });
});
