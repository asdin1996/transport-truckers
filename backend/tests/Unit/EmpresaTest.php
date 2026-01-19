<?php

namespace Tests\Unit;

use App\Models\Empresa;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class EmpresaTest extends TestCase
{
    #[Test]
    public function tiene_fillable_correcto(): void
    {
        $empresa = new Empresa();

        $this->assertEquals(
            ['nombre', 'cif', 'email', 'telefono', 'direccion'],
            $empresa->getFillable()
        );
    }

    #[Test]
    public function usa_soft_deletes(): void
    {
        $this->assertContains(
            'Illuminate\Database\Eloquent\SoftDeletes',
            class_uses_recursive(Empresa::class)
        );
    }
}
