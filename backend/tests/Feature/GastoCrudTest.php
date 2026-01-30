<?php

namespace Tests\Feature;

use App\Models\Camionero;
use App\Models\Gasto;
use App\Models\User;
use App\Models\Viaje;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class GastoCrudTest extends TestCase
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
    public function listar_gastos_requiere_autenticacion(): void
    {
        $this->getJson('/api/v1/gastos')->assertUnauthorized();
    }

    #[Test]
    public function puede_listar_gastos_por_viaje(): void
    {
        $viaje = Viaje::factory()->create();
        Gasto::factory()->count(3)->create(['viaje_id' => $viaje->id]);
        Gasto::factory()->count(2)->create(); // otro viaje

        $response = $this->withToken($this->adminToken())
            ->getJson("/api/v1/gastos?viaje_id={$viaje->id}");

        $response->assertOk()->assertJsonCount(3, 'data');
    }

    #[Test]
    public function admin_puede_crear_gasto(): void
    {
        $viaje = Viaje::factory()->create();

        $response = $this->withToken($this->adminToken())->postJson('/api/v1/gastos', [
            'viaje_id' => $viaje->id,
            'tipo' => 'combustible',
            'importe' => 85.50,
            'fecha' => '2026-04-10',
            'descripcion' => 'Gasoil autopista',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.tipo', 'combustible')
            ->assertJsonPath('data.importe', '85.50');

        $this->assertDatabaseHas('gastos', ['viaje_id' => $viaje->id, 'tipo' => 'combustible']);
    }

    #[Test]
    public function camionero_puede_crear_gasto_en_su_viaje(): void
    {
        [, $camionero, $token] = $this->camioneroConToken();
        $viaje = Viaje::factory()->create(['camionero_id' => $camionero->id]);

        $response = $this->withToken($token)->postJson('/api/v1/gastos', [
            'viaje_id' => $viaje->id,
            'tipo' => 'peaje',
            'importe' => 12.30,
            'fecha' => '2026-04-10',
        ]);

        $response->assertCreated();
    }

    #[Test]
    public function crear_gasto_con_foto_ticket(): void
    {
        Storage::fake('public');
        $viaje = Viaje::factory()->create();
        $foto = UploadedFile::fake()->create('ticket.jpg', 100, 'image/jpeg');

        $response = $this->withToken($this->adminToken())->postJson('/api/v1/gastos', [
            'viaje_id' => $viaje->id,
            'tipo' => 'dieta',
            'importe' => 15.00,
            'fecha' => '2026-04-10',
            'foto_ticket' => $foto,
        ]);

        $response->assertCreated();
        $rutaFoto = $response->json('data.foto_ticket');
        $this->assertNotNull($rutaFoto);
        Storage::disk('public')->assertExists($rutaFoto);
    }

    #[Test]
    public function crear_gasto_sin_campos_requeridos_devuelve_422(): void
    {
        $response = $this->withToken($this->adminToken())->postJson('/api/v1/gastos', []);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['viaje_id', 'tipo', 'importe', 'fecha']);
    }

    #[Test]
    public function crear_gasto_con_tipo_invalido_devuelve_422(): void
    {
        $viaje = Viaje::factory()->create();

        $response = $this->withToken($this->adminToken())->postJson('/api/v1/gastos', [
            'viaje_id' => $viaje->id,
            'tipo' => 'parking',
            'importe' => 10,
            'fecha' => '2026-04-10',
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors(['tipo']);
    }

    #[Test]
    public function admin_puede_ver_cualquier_gasto(): void
    {
        $gasto = Gasto::factory()->create();

        $response = $this->withToken($this->adminToken())->getJson("/api/v1/gastos/{$gasto->id}");

        $response->assertOk()->assertJsonPath('data.id', $gasto->id);
    }

    #[Test]
    public function camionero_no_puede_ver_gasto_ajeno(): void
    {
        [,, $token] = $this->camioneroConToken();
        $gasto = Gasto::factory()->create();

        $this->withToken($token)->getJson("/api/v1/gastos/{$gasto->id}")->assertForbidden();
    }

    #[Test]
    public function camionero_puede_ver_su_gasto(): void
    {
        [, $camionero, $token] = $this->camioneroConToken();
        $viaje = Viaje::factory()->create(['camionero_id' => $camionero->id]);
        $gasto = Gasto::factory()->create(['viaje_id' => $viaje->id]);

        $this->withToken($token)->getJson("/api/v1/gastos/{$gasto->id}")->assertOk();
    }

    #[Test]
    public function admin_puede_actualizar_gasto(): void
    {
        $gasto = Gasto::factory()->create();

        $response = $this->withToken($this->adminToken())
            ->putJson("/api/v1/gastos/{$gasto->id}", [
                'tipo' => 'otro',
                'importe' => 200.00,
            ]);

        $response->assertOk()->assertJsonPath('data.tipo', 'otro');
    }

    #[Test]
    public function admin_puede_eliminar_gasto(): void
    {
        $gasto = Gasto::factory()->create();

        $this->withToken($this->adminToken())->deleteJson("/api/v1/gastos/{$gasto->id}")->assertOk();
        $this->assertSoftDeleted('gastos', ['id' => $gasto->id]);
    }

    #[Test]
    public function ver_gasto_inexistente_devuelve_404(): void
    {
        $this->withToken($this->adminToken())->getJson('/api/v1/gastos/999')->assertNotFound();
    }

    #[Test]
    public function eliminar_gasto_borra_foto_del_storage(): void
    {
        Storage::fake('public');
        $foto = UploadedFile::fake()->create('ticket.jpg', 100, 'image/jpeg');
        $ruta = $foto->store('tickets', 'public');

        $gasto = Gasto::factory()->create(['foto_ticket' => $ruta]);

        Storage::disk('public')->assertExists($ruta);

        $this->withToken($this->adminToken())->deleteJson("/api/v1/gastos/{$gasto->id}")->assertOk();

        Storage::disk('public')->assertMissing($ruta);
    }
}
