<?php

namespace Tests\Feature;

use App\Models\Camionero;
use App\Models\Documento;
use App\Models\User;
use App\Models\Viaje;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class DocumentoCrudTest extends TestCase
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
    public function listar_documentos_requiere_autenticacion(): void
    {
        $this->getJson('/api/v1/documentos')->assertUnauthorized();
    }

    #[Test]
    public function puede_listar_documentos_por_viaje(): void
    {
        $viaje = Viaje::factory()->create();
        Documento::factory()->count(2)->create(['viaje_id' => $viaje->id]);
        Documento::factory()->count(3)->create();

        $response = $this->withToken($this->adminToken())
            ->getJson("/api/v1/documentos?viaje_id={$viaje->id}");

        $response->assertOk()->assertJsonCount(2, 'data');
    }

    #[Test]
    public function admin_puede_subir_documento(): void
    {
        Storage::fake('local');
        $viaje = Viaje::factory()->create();
        $archivo = UploadedFile::fake()->create('cmr_001.pdf', 500, 'application/pdf');

        $response = $this->withToken($this->adminToken())->postJson('/api/v1/documentos', [
            'viaje_id' => $viaje->id,
            'tipo' => 'cmr',
            'archivo' => $archivo,
            'fecha' => '2026-04-10',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.tipo', 'cmr')
            ->assertJsonPath('data.nombre_original', 'cmr_001.pdf');

        $rutaArchivo = $response->json('data.archivo');
        Storage::disk('local')->assertExists($rutaArchivo);
    }

    #[Test]
    public function camionero_puede_subir_documento_en_su_viaje(): void
    {
        Storage::fake('local');
        [, $camionero, $token] = $this->camioneroConToken();
        $viaje = Viaje::factory()->create(['camionero_id' => $camionero->id]);
        $archivo = UploadedFile::fake()->create('albaran.pdf', 200, 'application/pdf');

        $response = $this->withToken($token)->postJson('/api/v1/documentos', [
            'viaje_id' => $viaje->id,
            'tipo' => 'albaran',
            'archivo' => $archivo,
            'fecha' => '2026-04-10',
        ]);

        $response->assertCreated();
    }

    #[Test]
    public function subir_documento_sin_campos_requeridos_devuelve_422(): void
    {
        $response = $this->withToken($this->adminToken())->postJson('/api/v1/documentos', []);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['viaje_id', 'tipo', 'archivo', 'fecha']);
    }

    #[Test]
    public function subir_documento_con_tipo_invalido_devuelve_422(): void
    {
        Storage::fake('local');
        $viaje = Viaje::factory()->create();
        $archivo = UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf');

        $response = $this->withToken($this->adminToken())->postJson('/api/v1/documentos', [
            'viaje_id' => $viaje->id,
            'tipo' => 'contrato',
            'archivo' => $archivo,
            'fecha' => '2026-04-10',
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors(['tipo']);
    }

    #[Test]
    public function admin_puede_ver_cualquier_documento(): void
    {
        $documento = Documento::factory()->create();

        $response = $this->withToken($this->adminToken())->getJson("/api/v1/documentos/{$documento->id}");

        $response->assertOk()->assertJsonPath('data.id', $documento->id);
    }

    #[Test]
    public function camionero_no_puede_ver_documento_ajeno(): void
    {
        [,, $token] = $this->camioneroConToken();
        $documento = Documento::factory()->create();

        $this->withToken($token)->getJson("/api/v1/documentos/{$documento->id}")->assertForbidden();
    }

    #[Test]
    public function camionero_puede_ver_su_documento(): void
    {
        [, $camionero, $token] = $this->camioneroConToken();
        $viaje = Viaje::factory()->create(['camionero_id' => $camionero->id]);
        $documento = Documento::factory()->create(['viaje_id' => $viaje->id]);

        $this->withToken($token)->getJson("/api/v1/documentos/{$documento->id}")->assertOk();
    }

    #[Test]
    public function admin_puede_actualizar_tipo_de_documento(): void
    {
        $documento = Documento::factory()->create(['tipo' => 'cmr']);

        $response = $this->withToken($this->adminToken())
            ->putJson("/api/v1/documentos/{$documento->id}", ['tipo' => 'factura']);

        $response->assertOk()->assertJsonPath('data.tipo', 'factura');
    }

    #[Test]
    public function admin_puede_eliminar_documento(): void
    {
        $documento = Documento::factory()->create();

        $this->withToken($this->adminToken())->deleteJson("/api/v1/documentos/{$documento->id}")->assertOk();
        $this->assertSoftDeleted('documentos', ['id' => $documento->id]);
    }

    #[Test]
    public function eliminar_documento_borra_archivo_del_storage(): void
    {
        Storage::fake('local');
        $archivo = UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf');
        $ruta = $archivo->store('documentos', 'local');

        $documento = Documento::factory()->create(['archivo' => $ruta]);

        Storage::disk('local')->assertExists($ruta);

        $this->withToken($this->adminToken())->deleteJson("/api/v1/documentos/{$documento->id}")->assertOk();

        Storage::disk('local')->assertMissing($ruta);
    }

    #[Test]
    public function admin_puede_descargar_documento(): void
    {
        Storage::fake('local');
        $archivo = UploadedFile::fake()->create('factura.pdf', 100, 'application/pdf');
        $ruta = $archivo->store('documentos', 'local');
        $documento = Documento::factory()->create(['archivo' => $ruta, 'nombre_original' => 'factura.pdf']);

        $response = $this->withToken($this->adminToken())
            ->get("/api/v1/documentos/{$documento->id}/descargar");

        $response->assertOk();
        $this->assertEquals('application/pdf', $response->headers->get('Content-Type'));
    }

    #[Test]
    public function ver_documento_inexistente_devuelve_404(): void
    {
        $this->withToken($this->adminToken())->getJson('/api/v1/documentos/999')->assertNotFound();
    }
}
