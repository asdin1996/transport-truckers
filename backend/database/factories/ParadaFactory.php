<?php

namespace Database\Factories;

use App\Models\Parada;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Parada>
 */
class ParadaFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $ciudades = ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Zaragoza', 'Málaga', 'Bilbao', 'Alicante', 'Córdoba', 'Valladolid'];

        return [
            'nombre' => $this->faker->randomElement($ciudades) . ' - ' . $this->faker->company(),
        ];
    }
}
