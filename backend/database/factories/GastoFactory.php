<?php

namespace Database\Factories;

use App\Models\Gasto;
use App\Models\Viaje;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Gasto>
 */
class GastoFactory extends Factory
{
    public function definition(): array
    {
        return [
            'viaje_id' => Viaje::factory(),
            'tipo' => $this->faker->randomElement(Gasto::TIPOS),
            'importe' => $this->faker->randomFloat(2, 5, 500),
            'descripcion' => $this->faker->boolean(60) ? $this->faker->sentence() : null,
            'fecha' => $this->faker->dateTimeBetween('-60 days')->format('Y-m-d'),
            'foto_ticket' => null,
        ];
    }
}
