<?php

namespace Tests\Feature;

use App\Models\Camionero;
use App\Models\Ruta;
use App\Models\User;
use App\Models\Vehiculo;
use App\Models\Viaje;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ViajeCrudTest extends TestCase
{
    use RefreshDatabase;

    private function adminToken(): string
    {
        return User::factory()->create(['role' => 'admin'])->createToken('test')->plainTextToken;
    }

    private function camioneroConToken(): array
    {
        $user = User::factory()->create(['role' => 'camionero']);
        $camionero = Camionero::factory()->create(['user_id' => $user->id]);
        $token = $user->createToken('test')->plainTextToken;
        return [$user, $camionero, $token];
    }

    #[Test]
    public function listar_viajes_requiere_autenticacion(): void
    {
        $this->getJson('/api/v1/viajes')->assertUnauthorized();
    }

    #[Test]
    public function admin_ve_todos_los_viajes(): void
    {
        Viaje::factory()->count(3)->create();

        $response = $this->withToken($this->adminToken())->getJson('/api/v1/viajes');

        $response->assertOk()->assertJsonCount(3, 'data');
    }

    #[Test]
    public function camionero_solo_ve_sus_viajes(): void
    {
        [, $camionero, $token] = $this->camioneroConToken();

        Viaje::factory()->count(2)->create(['camionero_id' => $camionero->id]);
        Viaje::factory()->count(3)->create(); // de otros camioneros

        $response = $this->withToken($token)->getJson('/api/v1/viajes');

        $response->assertOk()->assertJsonCount(2, 'data');
    }

    #[Test]
    public function admin_puede_crear_viaje(): void
    {
        $camionero = Camionero::factory()->create();
        $vehiculo = Vehiculo::factory()->create();
        $ruta = Ruta::factory()->create();

        $response = $this->withToken($this->adminToken())->postJson('/api/v1/viajes', [
            'camionero_id' => $camionero->id,
            'vehiculo_id' => $vehiculo->id,
            'ruta_id' => $ruta->id,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.estado', 'pendiente')
            ->assertJsonPath('data.camionero.id', $camionero->id);
    }

    #[Test]
    public function camionero_puede_crear_su_propio_viaje(): void
    {
        [, $camionero, $token] = $this->camioneroConToken();

        $response = $this->withToken($token)->postJson('/api/v1/viajes', [
            'camionero_id' => $camionero->id,
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('viajes', ['camionero_id' => $camionero->id]);
    }

    #[Test]
    public function crear_viaje_sin_camionero_devuelve_422(): void
    {
        $response = $this->withToken($this->adminToken())->postJson('/api/v1/viajes', []);

        $response->assertUnprocessable()->assertJsonValidationErrors(['camionero_id']);
    }

    #[Test]
    public function admin_puede_ver_cualquier_viaje(): void
    {
        $viaje = Viaje::factory()->create();

        $response = $this->withToken($this->adminToken())->getJson("/api/v1/viajes/{$viaje->id}");

        $response->assertOk()->assertJsonPath('data.id', $viaje->id);
    }

    #[Test]
    public function camionero_no_puede_ver_viaje_ajeno(): void
    {
        [,, $token] = $this->camioneroConToken();
        $viajeAjeno = Viaje::factory()->create();

        $this->withToken($token)->getJson("/api/v1/viajes/{$viajeAjeno->id}")->assertForbidden();
    }

    #[Test]
    public function camionero_puede_ver_su_propio_viaje(): void
    {
        [, $camionero, $token] = $this->camioneroConToken();
        $viaje = Viaje::factory()->create(['camionero_id' => $camionero->id]);

        $response = $this->withToken($token)->getJson("/api/v1/viajes/{$viaje->id}");

        $response->assertOk()->assertJsonPath('data.id', $viaje->id);
    }

    #[Test]
    public function admin_puede_cambiar_estado(): void
    {
        $viaje = Viaje::factory()->pendiente()->create();

        $response = $this->withToken($this->adminToken())
            ->patchJson("/api/v1/viajes/{$viaje->id}/estado", ['estado' => 'en_curso']);

        $response->assertOk()->assertJsonPath('data.estado', 'en_curso');
        $this->assertDatabaseHas('viajes', ['id' => $viaje->id, 'estado' => 'en_curso']);
    }

    #[Test]
    public function cambiar_estado_con_valor_invalido_devuelve_422(): void
    {
        $viaje = Viaje::factory()->create();

        $response = $this->withToken($this->adminToken())
            ->patchJson("/api/v1/viajes/{$viaje->id}/estado", ['estado' => 'volando']);

        $response->assertUnprocessable()->assertJsonValidationErrors(['estado']);
    }

    #[Test]
    public function admin_puede_actualizar_viaje(): void
    {
        $viaje = Viaje::factory()->create();

        $response = $this->withToken($this->adminToken())
            ->putJson("/api/v1/viajes/{$viaje->id}", ['notas' => 'Entrega urgente']);

        $response->assertOk()->assertJsonPath('data.notas', 'Entrega urgente');
    }

    #[Test]
    public function admin_puede_eliminar_viaje(): void
    {
        $viaje = Viaje::factory()->create();

        $this->withToken($this->adminToken())->deleteJson("/api/v1/viajes/{$viaje->id}")->assertOk();
        $this->assertSoftDeleted('viajes', ['id' => $viaje->id]);
    }

    #[Test]
    public function ver_viaje_inexistente_devuelve_404(): void
    {
        $this->withToken($this->adminToken())->getJson('/api/v1/viajes/999')->assertNotFound();
    }
}
