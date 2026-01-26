<?php

namespace Database\Factories;

use App\Models\Ruta;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Ruta>
 */
class RutaFactory extends Factory
{
    public function definition(): array
    {
        $ciudades = ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Bilbao', 'Zaragoza', 'Málaga', 'Murcia', 'Palma', 'Valladolid'];

        $origen = $this->faker->randomElement($ciudades);
        $destino = $this->faker->randomElement(array_diff($ciudades, [$origen]));

        return [
            'origen' => $origen,
            'destino' => $destino,
            'km_estimados' => $this->faker->numberBetween(50, 1200),
            'paradas' => $this->faker->boolean(50)
                ? $this->faker->randomElements($ciudades, $this->faker->numberBetween(1, 3))
                : null,
        ];
    }
}
