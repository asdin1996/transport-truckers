<?php

namespace Database\Factories;

use App\Models\Camionero;
use App\Models\Ubicacion;
use App\Models\Viaje;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Ubicacion>
 */
class UbicacionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'camionero_id'  => Camionero::factory(),
            'viaje_id'      => null,
            'lat'           => $this->faker->latitude(35.0, 43.8),
            'lng'           => $this->faker->longitude(-9.5, 4.5),
            'registrado_at' => now(),
        ];
    }

    public function conViaje(int $viajeId): static
    {
        return $this->state(['viaje_id' => $viajeId]);
    }
}
