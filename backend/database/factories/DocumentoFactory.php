<?php

namespace Database\Factories;

use App\Models\Documento;
use App\Models\Viaje;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Documento>
 */
class DocumentoFactory extends Factory
{
    public function definition(): array
    {
        $tipo = $this->faker->randomElement(Documento::TIPOS);

        return [
            'viaje_id' => Viaje::factory(),
            'tipo' => $tipo,
            'archivo' => 'documentos/' . $this->faker->uuid() . '.pdf',
            'nombre_original' => strtoupper($tipo) . '_' . $this->faker->numerify('####') . '.pdf',
            'fecha' => $this->faker->dateTimeBetween('-60 days')->format('Y-m-d'),
        ];
    }
}
