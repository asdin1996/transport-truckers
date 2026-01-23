<?php

namespace Tests\Feature;

use App\Models\Empresa;
use App\Models\User;
use App\Models\Vehiculo;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class VehiculoCrudTest extends TestCase
{
    use RefreshDatabase;

    private function adminToken(): string
    {
        return User::factory()->create(['role' => 'admin'])->createToken('test')->plainTextToken;
    }

    private function camioneroToken(): string
    {
        return User::factory()->create(['role' => 'camionero'])->createToken('test')->plainTextToken;
    }

    #[Test]
    public function listar_vehiculos_requiere_autenticacion(): void
    {
        $this->getJson('/api/v1/vehiculos')->assertUnauthorized();
    }

    #[Test]
    public function admin_puede_listar_vehiculos(): void
    {
        Vehiculo::factory()->count(3)->create();

        $response = $this->withToken($this->adminToken())->getJson('/api/v1/vehiculos');

        $response->assertOk()->assertJsonCount(3, 'data');
    }

    #[Test]
    public function camionero_puede_listar_vehiculos(): void
    {
        Vehiculo::factory()->count(2)->create();

        $response = $this->withToken($this->camioneroToken())->getJson('/api/v1/vehiculos');

        $response->assertOk()->assertJsonCount(2, 'data');
    }

    #[Test]
    public function admin_puede_crear_vehiculo(): void
    {
        $empresa = Empresa::factory()->create();

        $response = $this->withToken($this->adminToken())->postJson('/api/v1/vehiculos', [
            'empresa_id' => $empresa->id,
            'matricula' => '1234-ABC',
            'marca' => 'Volvo',
            'modelo' => 'FH16',
            'anio' => 2022,
        ]);

        $response->assertCreated()->assertJsonPath('data.matricula', '1234-ABC');
        $this->assertDatabaseHas('vehiculos', ['matricula' => '1234-ABC']);
    }

    #[Test]
    public function camionero_puede_crear_vehiculo(): void
    {
        $response = $this->withToken($this->camioneroToken())->postJson('/api/v1/vehiculos', [
            'matricula' => '5678-XYZ',
            'marca' => 'Scania',
            'modelo' => 'R500',
            'anio' => 2021,
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('vehiculos', ['matricula' => '5678-XYZ']);
    }

    #[Test]
    public function crear_vehiculo_sin_matricula_devuelve_422(): void
    {
        $response = $this->withToken($this->adminToken())->postJson('/api/v1/vehiculos', [
            'marca' => 'Volvo',
            'modelo' => 'FH16',
            'anio' => 2022,
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors(['matricula']);
    }

    #[Test]
    public function crear_vehiculo_con_matricula_duplicada_devuelve_422(): void
    {
        Vehiculo::factory()->create(['matricula' => '1111-AAA']);

        $response = $this->withToken($this->adminToken())->postJson('/api/v1/vehiculos', [
            'matricula' => '1111-AAA',
            'marca' => 'Volvo',
            'modelo' => 'FH16',
            'anio' => 2022,
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors(['matricula']);
    }

    #[Test]
    public function puede_ver_un_vehiculo(): void
    {
        $vehiculo = Vehiculo::factory()->create();

        $response = $this->withToken($this->adminToken())->getJson("/api/v1/vehiculos/{$vehiculo->id}");

        $response->assertOk()->assertJsonPath('data.id', $vehiculo->id);
    }

    #[Test]
    public function ver_vehiculo_inexistente_devuelve_404(): void
    {
        $this->withToken($this->adminToken())->getJson('/api/v1/vehiculos/999')->assertNotFound();
    }

    #[Test]
    public function admin_puede_actualizar_vehiculo(): void
    {
        $vehiculo = Vehiculo::factory()->create();

        $response = $this->withToken($this->adminToken())->putJson("/api/v1/vehiculos/{$vehiculo->id}", [
            'marca' => 'MAN',
            'modelo' => 'TGX',
            'anio' => 2023,
        ]);

        $response->assertOk()->assertJsonPath('data.marca', 'MAN');
        $this->assertDatabaseHas('vehiculos', ['id' => $vehiculo->id, 'marca' => 'MAN']);
    }

    #[Test]
    public function admin_puede_eliminar_vehiculo(): void
    {
        $vehiculo = Vehiculo::factory()->create();

        $response = $this->withToken($this->adminToken())->deleteJson("/api/v1/vehiculos/{$vehiculo->id}");

        $response->assertOk();
        $this->assertSoftDeleted('vehiculos', ['id' => $vehiculo->id]);
    }

    #[Test]
    public function eliminar_vehiculo_inexistente_devuelve_404(): void
    {
        $this->withToken($this->adminToken())->deleteJson('/api/v1/vehiculos/999')->assertNotFound();
    }
}
