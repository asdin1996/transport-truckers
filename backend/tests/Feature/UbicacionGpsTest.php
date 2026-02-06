<?php

namespace Tests\Feature;

use App\Models\Camionero;
use App\Models\Ubicacion;
use App\Models\User;
use App\Models\Viaje;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class UbicacionGpsTest extends TestCase
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

    // ── Registrar ubicación ───────────────────────────────────────────────────

    #[Test]
    public function registrar_ubicacion_requiere_autenticacion(): void
    {
        $this->postJson('/api/v1/ubicaciones', [])->assertUnauthorized();
    }

    #[Test]
    public function camionero_puede_registrar_ubicacion(): void
    {
        [, $camionero, $token] = $this->camioneroConToken();

        $response = $this->withToken($token)->postJson('/api/v1/ubicaciones', [
            'lat' => 40.4168,
            'lng' => -3.7038,
        ]);

        $response->assertCreated()
            ->assertJsonPath('status', 'ok')
            ->assertJsonPath('data.camionero_id', $camionero->id);

        $this->assertDatabaseHas('ubicaciones', [
            'camionero_id' => $camionero->id,
            'lat'          => 40.4168,
            'lng'          => -3.7038,
        ]);
    }

    #[Test]
    public function camionero_puede_registrar_ubicacion_con_viaje(): void
    {
        [$user, $camionero, $token] = $this->camioneroConToken();
        $viaje = Viaje::factory()->create(['camionero_id' => $camionero->id]);

        $response = $this->withToken($token)->postJson('/api/v1/ubicaciones', [
            'lat'      => 41.3851,
            'lng'      => 2.1734,
            'viaje_id' => $viaje->id,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.viaje_id', $viaje->id);
    }

    #[Test]
    public function admin_no_puede_registrar_ubicacion(): void
    {
        $this->withToken($this->adminToken())->postJson('/api/v1/ubicaciones', [
            'lat' => 40.4168,
            'lng' => -3.7038,
        ])->assertForbidden();
    }

    #[Test]
    public function lat_y_lng_son_obligatorios(): void
    {
        [,, $token] = $this->camioneroConToken();

        $this->withToken($token)->postJson('/api/v1/ubicaciones', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['lat', 'lng']);
    }

    #[Test]
    public function lat_debe_estar_entre_minus90_y_90(): void
    {
        [,, $token] = $this->camioneroConToken();

        $this->withToken($token)->postJson('/api/v1/ubicaciones', [
            'lat' => 91,
            'lng' => 0,
        ])->assertUnprocessable()->assertJsonValidationErrors(['lat']);
    }

    #[Test]
    public function lng_debe_estar_entre_minus180_y_180(): void
    {
        [,, $token] = $this->camioneroConToken();

        $this->withToken($token)->postJson('/api/v1/ubicaciones', [
            'lat' => 0,
            'lng' => 181,
        ])->assertUnprocessable()->assertJsonValidationErrors(['lng']);
    }

    // ── Consultar última ubicación por camionero ──────────────────────────────

    #[Test]
    public function puede_consultar_ultima_ubicacion_de_camionero(): void
    {
        [, $camionero] = $this->camioneroConToken();

        Ubicacion::factory()->create([
            'camionero_id'  => $camionero->id,
            'lat'           => 40.4168,
            'lng'           => -3.7038,
            'registrado_at' => now()->subMinutes(10),
        ]);
        $ultima = Ubicacion::factory()->create([
            'camionero_id'  => $camionero->id,
            'lat'           => 41.3851,
            'lng'           => 2.1734,
            'registrado_at' => now(),
        ]);

        $this->withToken($this->adminToken())
            ->getJson("/api/v1/ubicaciones/camionero/{$camionero->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $ultima->id)
            ->assertJsonPath('data.lat', 41.3851);
    }

    #[Test]
    public function retorna_404_si_camionero_sin_ubicaciones(): void
    {
        [, $camionero] = $this->camioneroConToken();

        $this->withToken($this->adminToken())
            ->getJson("/api/v1/ubicaciones/camionero/{$camionero->id}")
            ->assertNotFound();
    }

    // ── Consultar última ubicación por viaje ──────────────────────────────────

    #[Test]
    public function puede_consultar_ultima_ubicacion_de_viaje(): void
    {
        [, $camionero] = $this->camioneroConToken();
        $viaje = Viaje::factory()->create(['camionero_id' => $camionero->id]);

        Ubicacion::factory()->create([
            'camionero_id'  => $camionero->id,
            'viaje_id'      => $viaje->id,
            'registrado_at' => now()->subMinutes(5),
        ]);
        $ultima = Ubicacion::factory()->create([
            'camionero_id'  => $camionero->id,
            'viaje_id'      => $viaje->id,
            'registrado_at' => now(),
        ]);

        $this->withToken($this->adminToken())
            ->getJson("/api/v1/ubicaciones/viaje/{$viaje->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $ultima->id);
    }

    #[Test]
    public function retorna_404_si_viaje_sin_ubicaciones(): void
    {
        $viaje = Viaje::factory()->create();

        $this->withToken($this->adminToken())
            ->getJson("/api/v1/ubicaciones/viaje/{$viaje->id}")
            ->assertNotFound();
    }

    // ── Historial de ubicaciones por viaje ────────────────────────────────────

    #[Test]
    public function puede_consultar_historial_de_ubicaciones_de_viaje(): void
    {
        [, $camionero] = $this->camioneroConToken();
        $viaje = Viaje::factory()->create(['camionero_id' => $camionero->id]);

        Ubicacion::factory()->count(5)->create([
            'camionero_id' => $camionero->id,
            'viaje_id'     => $viaje->id,
        ]);
        // Ubicación de otro viaje — no debe aparecer
        Ubicacion::factory()->create(['camionero_id' => $camionero->id]);

        $this->withToken($this->adminToken())
            ->getJson("/api/v1/ubicaciones/viaje/{$viaje->id}/historial")
            ->assertOk()
            ->assertJsonCount(5, 'data');
    }

    #[Test]
    public function consultar_ubicacion_requiere_autenticacion(): void
    {
        $this->getJson('/api/v1/ubicaciones/camionero/1')->assertUnauthorized();
        $this->getJson('/api/v1/ubicaciones/viaje/1')->assertUnauthorized();
        $this->getJson('/api/v1/ubicaciones/viaje/1/historial')->assertUnauthorized();
    }
}
