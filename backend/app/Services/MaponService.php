<?php

namespace App\Services;

use App\Models\Camionero;
use App\Models\Configuracion;
use App\Models\Parada;
use App\Models\User;
use App\Models\Vehiculo;
use App\Models\Viaje;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class MaponService
{
    private const BASE_URL = 'https://mapon.com/api/v1';

    public function getUnits(): array
    {
        $key = Configuracion::get('mapon_api_key');

        if (!$key) {
            return [];
        }

        try {
            $response = Http::timeout(10)->get(self::BASE_URL . '/unit/list.json', [
                'key' => $key,
            ]);
        } catch (ConnectionException $e) {
            throw new \RuntimeException('No se pudo conectar con la API de Mapon: ' . $e->getMessage());
        }

        if (!$response->successful()) {
            throw new \RuntimeException('Error en la API de Mapon: HTTP ' . $response->status());
        }

        $units = $response->json('data.units') ?? [];

        return collect($units)
            ->filter(fn($u) => isset($u['lat'], $u['lng']))
            ->map(fn($u) => [
                'unit_id'    => $u['unit_id'],
                'label'      => $u['number'] ?? $u['label'] ?? $u['unit_id'],
                'lat'        => (float) $u['lat'],
                'lng'        => (float) $u['lng'],
                'speed'      => (int) ($u['speed'] ?? 0),
                'direction'  => (int) ($u['direction'] ?? 0),
                'updated_at' => $u['last_update'] ?? null,
            ])
            ->values()
            ->toArray();
    }

    public function getDashboard(): array
    {
        $units = collect($this->getUnits())->keyBy(fn($u) => strtoupper(trim($u['label'] ?? '')));

        $estadosActivos = ['en_camino', 'llegada_destino', 'cargando', 'descargando'];

        $viajes = Viaje::whereIn('estado', $estadosActivos)
            ->with(['vehiculo', 'camionero'])
            ->get();

        return $viajes->map(function ($viaje) use ($units) {
            $matricula = strtoupper(trim($viaje->vehiculo?->matricula ?? ''));
            $gps = $units->get($matricula);

            $progreso = $this->calcularProgreso($viaje);
            $parada   = $viaje->destino
                ? Parada::where('nombre', $viaje->destino)->whereNotNull('lat')->first()
                : null;

            return [
                'viaje_id'    => $viaje->id,
                'estado'      => $viaje->estado,
                'origen'      => $viaje->origen,
                'destino'     => $viaje->destino,
                'camionero'   => $viaje->camionero?->nombreCompleto(),
                'matricula'   => $viaje->vehiculo?->matricula,
                'fecha_inicio'=> $viaje->fecha_inicio?->toDateString(),
                'fecha_fin'   => $viaje->fecha_fin?->toDateString(),
                'progreso'    => $progreso,
                'gps'         => $gps,
                'destino_lat' => $parada?->lat,
                'destino_lng' => $parada?->lng,
            ];
        })->values()->toArray();
    }

    private function calcularProgreso(Viaje $viaje): int
    {
        return match ($viaje->estado) {
            'en_camino'        => 25,
            'llegada_destino'  => 50,
            'cargando'         => 75,
            'descargando'      => 75,
            default            => 0,
        };
    }

    public function syncVehiculos(bool $limpiar = false): array
    {
        $units = $this->fetchUnitsRaw();

        if ($limpiar) {
            \Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=0');
            \Illuminate\Support\Facades\DB::table('vehiculos')->delete();
            \Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=1');
        }

        $created = 0;
        $updated = 0;
        $skipped = 0;

        foreach ($units as $unit) {
            $matricula = strtoupper(trim($unit['number'] ?? ''));
            if (!$matricula) { $skipped++; continue; }

            $marca  = trim($unit['make']  ?? '');
            $modelo = trim($unit['model'] ?? $unit['label'] ?? 'Desconocido');
            if (!$marca) $marca = strtok($modelo, ' ') ?: 'Desconocido';

            $existing = Vehiculo::where('matricula', $matricula)->first();

            if ($existing) {
                $existing->update(['marca' => $marca, 'modelo' => $modelo]);
                $updated++;
            } else {
                Vehiculo::create([
                    'matricula' => $matricula,
                    'marca'     => $marca,
                    'modelo'    => $modelo,
                    'anio'      => 0,
                ]);
                $created++;
            }
        }

        return ['total' => count($units), 'created' => $created, 'updated' => $updated, 'skipped' => $skipped];
    }

    public function syncCamioneros(): array
    {
        $key = Configuracion::get('mapon_api_key');
        if (!$key) throw new \RuntimeException('API key no configurada');

        try {
            $response = Http::timeout(15)->get(self::BASE_URL . '/driver/list.json', ['key' => $key]);
        } catch (ConnectionException $e) {
            throw new \RuntimeException('No se pudo conectar con Mapon: ' . $e->getMessage());
        }

        if (!$response->successful()) {
            throw new \RuntimeException('Error en la API de Mapon: HTTP ' . $response->status());
        }

        $drivers = $response->json('data.drivers') ?? $response->json('data') ?? [];

        $created = 0;
        $updated = 0;
        $skipped = 0;

        foreach ($drivers as $driver) {
            $nombre    = trim($driver['name'] ?? $driver['first_name'] ?? '');
            $apellidos = trim($driver['surname'] ?? $driver['last_name'] ?? '');
            $email     = isset($driver['email']) && $driver['email'] ? strtolower(trim($driver['email'])) : null;
            $telefono  = $driver['phone'] ?? $driver['phone_number'] ?? null;

            if (!$nombre) { $skipped++; continue; }

            $camionero = null;

            if ($email) {
                $user = User::where('email', $email)->first();
                $camionero = $user?->camionero;
            }

            if (!$camionero) {
                $camionero = Camionero::where('nombre', $nombre)
                    ->where('apellidos', $apellidos)
                    ->first();
            }

            if ($camionero) {
                $camionero->update(array_filter([
                    'nombre'    => $nombre,
                    'apellidos' => $apellidos,
                    'email'     => $email,
                    'telefono'  => $telefono,
                ]));
                $updated++;
            } else {
                $emailFinal = $email ?? $this->generarEmail($nombre, $apellidos);

                if (User::where('email', $emailFinal)->exists()) {
                    $skipped++;
                    continue;
                }

                $user = User::create([
                    'name'     => "{$nombre} {$apellidos}",
                    'email'    => $emailFinal,
                    'password' => bcrypt(Str::random(16)),
                    'role'     => 'camionero',
                ]);

                Camionero::create([
                    'user_id'   => $user->id,
                    'nombre'    => $nombre,
                    'apellidos' => $apellidos,
                    'email'     => $emailFinal,
                    'telefono'  => $telefono,
                ]);

                $created++;
            }
        }

        return ['total' => count($drivers), 'created' => $created, 'updated' => $updated, 'skipped' => $skipped];
    }

    private function generarEmail(string $nombre, string $apellidos): string
    {
        $partes          = [];
        $partesNombre    = preg_split('/\s+/', mb_strtolower(trim($nombre)));
        $partesApellidos = preg_split('/\s+/', mb_strtolower(trim($apellidos)));

        if (!empty($partesNombre[0])) {
            $partes[] = $partesNombre[0];
        }

        if (!empty($partesNombre[1])) {
            $partes[] = mb_substr($partesNombre[1], 0, 1);
        }

        foreach ($partesApellidos as $ap) {
            if ($ap !== '') {
                $partes[] = mb_substr($ap, 0, 1);
            }
        }

        $local = implode('.', $partes);
        $local = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $local);
        $local = preg_replace('/[^a-z0-9.]/', '', strtolower($local));

        return $local . '@cubicaje.com';
    }

    private function fetchUnitsRaw(): array
    {
        $key = Configuracion::get('mapon_api_key');
        if (!$key) throw new \RuntimeException('API key no configurada');

        try {
            $response = Http::timeout(15)->get(self::BASE_URL . '/unit/list.json', ['key' => $key]);
        } catch (ConnectionException $e) {
            throw new \RuntimeException('No se pudo conectar con Mapon: ' . $e->getMessage());
        }

        if (!$response->successful()) {
            throw new \RuntimeException('Error en la API de Mapon: HTTP ' . $response->status());
        }

        return $response->json('data.units') ?? [];
    }

    public function hasApiKey(): bool
    {
        return !empty(Configuracion::get('mapon_api_key'));
    }
}
