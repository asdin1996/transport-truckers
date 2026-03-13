<?php

namespace Tests\Unit;

use App\Models\Camionero;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class CamioneroTest extends TestCase
{
    #[Test]
    public function tiene_fillable_correcto(): void
    {
        $camionero = new Camionero();

        $this->assertEquals(
            ['user_id', 'nombre', 'apellidos', 'email', 'telefono', 'dni', 'fecha_nacimiento'],
            $camionero->getFillable()
        );
    }

    #[Test]
    public function castea_fecha_nacimiento_como_date(): void
    {
        $camionero = new Camionero();
        $casts = $camionero->getCasts();

        $this->assertArrayHasKey('fecha_nacimiento', $casts);
        $this->assertEquals('date', $casts['fecha_nacimiento']);
    }

    #[Test]
    public function nombre_completo_concatena_nombre_y_apellidos(): void
    {
        $camionero = new Camionero([
            'nombre' => 'Juan',
            'apellidos' => 'García López',
        ]);

        $this->assertEquals('Juan García López', $camionero->nombreCompleto());
    }

    #[Test]
    public function usa_soft_deletes(): void
    {
        $this->assertContains(
            'Illuminate\Database\Eloquent\SoftDeletes',
            class_uses_recursive(Camionero::class)
        );
    }

    #[Test]
    public function pertenece_a_un_user(): void
    {
        $camionero = new Camionero();
        $relation = $camionero->user();

        $this->assertInstanceOf(\Illuminate\Database\Eloquent\Relations\BelongsTo::class, $relation);
    }
}
