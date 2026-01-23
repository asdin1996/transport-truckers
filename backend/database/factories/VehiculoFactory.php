<?php

namespace Database\Factories;

use App\Models\Empresa;
use App\Models\Vehiculo;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Vehiculo>
 */
class VehiculoFactory extends Factory
{
    public function definition(): array
    {
        $marcas = ['Volvo', 'Scania', 'Mercedes-Benz', 'MAN', 'DAF', 'Iveco', 'Renault'];
        $marca = $this->faker->randomElement($marcas);

        return [
            'empresa_id' => Empresa::factory(),
            'matricula' => strtoupper($this->faker->bothify('####-???')),
            'marca' => $marca,
            'modelo' => $this->faker->bothify($marca . ' ##00'),
            'anio' => $this->faker->numberBetween(2000, 2024),
        ];
    }
}
