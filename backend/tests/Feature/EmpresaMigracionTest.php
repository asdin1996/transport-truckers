<?php

namespace Tests\Feature;

use App\Models\Empresa;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class EmpresaMigracionTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function puede_crear_una_empresa(): void
    {
        $empresa = Empresa::create([
            'nombre' => 'Transportes García S.L.',
            'cif' => 'B12345678',
            'email' => 'info@transportesgarcia.com',
            'telefono' => '912345678',
            'direccion' => 'Calle Mayor 1, Madrid',
        ]);

        $this->assertDatabaseHas('empresas', [
            'cif' => 'B12345678',
            'email' => 'info@transportesgarcia.com',
        ]);
        $this->assertEquals('Transportes García S.L.', $empresa->nombre);
    }

    #[Test]
    public function campos_opcionales_pueden_ser_nulos(): void
    {
        $empresa = Empresa::create([
            'nombre' => 'Empresa Sin Datos',
            'cif' => 'B99999999',
            'email' => 'test@empresa.com',
        ]);

        $this->assertNull($empresa->telefono);
        $this->assertNull($empresa->direccion);
    }

    #[Test]
    public function soft_delete_no_elimina_fisicamente(): void
    {
        $empresa = Empresa::factory()->create();
        $id = $empresa->id;

        $empresa->delete();

        $this->assertSoftDeleted('empresas', ['id' => $id]);
        $this->assertNull(Empresa::find($id));
        $this->assertNotNull(Empresa::withTrashed()->find($id));
    }

    #[Test]
    public function cif_es_unico(): void
    {
        $this->expectException(\Illuminate\Database\QueryException::class);

        Empresa::factory()->create(['cif' => 'B11111111']);
        Empresa::factory()->create(['cif' => 'B11111111']);
    }

    #[Test]
    public function email_es_unico(): void
    {
        $this->expectException(\Illuminate\Database\QueryException::class);

        Empresa::factory()->create(['email' => 'duplicado@empresa.com']);
        Empresa::factory()->create(['email' => 'duplicado@empresa.com']);
    }
}
