<?php

namespace Tests\Feature;

use App\Models\Ruta;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class RutaCrudTest extends TestCase
{
    use RefreshDatabase;

    private function token(): string
    {
        return User::factory()->create(['role' => 'admin'])->createToken('test')->plainTextToken;
    }

    #[Test]
    public function listar_rutas_requiere_autenticacion(): void
    {
        $this->getJson('/api/v1/rutas')->assertUnauthorized();
    }

    #[Test]
    public function puede_listar_rutas(): void
    {
        Ruta::factory()->count(3)->create();

        $response = $this->withToken($this->token())->getJson('/api/v1/rutas');

        $response->assertOk()->assertJsonCount(3, 'data');
    }

    #[Test]
    public function puede_crear_ruta_sin_paradas(): void
    {
        $response = $this->withToken($this->token())->postJson('/api/v1/rutas', [
            'origen' => 'Madrid',
            'destino' => 'Barcelona',
            'km_estimados' => 620,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.origen', 'Madrid')
            ->assertJsonPath('data.destino', 'Barcelona');

        $this->assertDatabaseHas('rutas', ['origen' => 'Madrid', 'destino' => 'Barcelona']);
    }

    #[Test]
    public function puede_crear_ruta_con_paradas(): void
    {
        $response = $this->withToken($this->token())->postJson('/api/v1/rutas', [
            'origen' => 'Madrid',
            'destino' => 'Valencia',
            'km_estimados' => 355,
            'paradas' => ['Albacete', 'Requena'],
        ]);

        $response->assertCreated();
        $this->assertEquals(['Albacete', 'Requena'], $response->json('data.paradas'));
    }

    #[Test]
    public function crear_ruta_sin_origen_devuelve_422(): void
    {
        $response = $this->withToken($this->token())->postJson('/api/v1/rutas', [
            'destino' => 'Barcelona',
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors(['origen']);
    }

    #[Test]
    public function crear_ruta_sin_destino_devuelve_422(): void
    {
        $response = $this->withToken($this->token())->postJson('/api/v1/rutas', [
            'origen' => 'Madrid',
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors(['destino']);
    }

    #[Test]
    public function puede_ver_una_ruta(): void
    {
        $ruta = Ruta::factory()->create();

        $response = $this->withToken($this->token())->getJson("/api/v1/rutas/{$ruta->id}");

        $response->assertOk()->assertJsonPath('data.id', $ruta->id);
    }

    #[Test]
    public function ver_ruta_inexistente_devuelve_404(): void
    {
        $this->withToken($this->token())->getJson('/api/v1/rutas/999')->assertNotFound();
    }

    #[Test]
    public function puede_actualizar_ruta(): void
    {
        $ruta = Ruta::factory()->create(['origen' => 'Madrid']);

        $response = $this->withToken($this->token())->putJson("/api/v1/rutas/{$ruta->id}", [
            'origen' => 'Sevilla',
            'km_estimados' => 500,
        ]);

        $response->assertOk()->assertJsonPath('data.origen', 'Sevilla');
        $this->assertDatabaseHas('rutas', ['id' => $ruta->id, 'origen' => 'Sevilla']);
    }

    #[Test]
    public function puede_actualizar_paradas_a_null(): void
    {
        $ruta = Ruta::factory()->create(['paradas' => ['Albacete']]);

        $response = $this->withToken($this->token())->putJson("/api/v1/rutas/{$ruta->id}", [
            'paradas' => null,
        ]);

        $response->assertOk()->assertJsonPath('data.paradas', null);
    }

    #[Test]
    public function puede_eliminar_ruta(): void
    {
        $ruta = Ruta::factory()->create();

        $response = $this->withToken($this->token())->deleteJson("/api/v1/rutas/{$ruta->id}");

        $response->assertOk();
        $this->assertDatabaseMissing('rutas', ['id' => $ruta->id]);
    }

    #[Test]
    public function eliminar_ruta_inexistente_devuelve_404(): void
    {
        $this->withToken($this->token())->deleteJson('/api/v1/rutas/999')->assertNotFound();
    }
}
