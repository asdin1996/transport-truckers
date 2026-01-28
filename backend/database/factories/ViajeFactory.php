<?php

namespace Database\Factories;

use App\Models\Camionero;
use App\Models\Ruta;
use App\Models\Vehiculo;
use App\Models\Viaje;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Viaje>
 */
class ViajeFactory extends Factory
{
    public function definition(): array
    {
        $estado = $this->faker->randomElement(Viaje::ESTADOS);
        $fechaInicio = in_array($estado, ['en_curso', 'completado']) ? $this->faker->dateTimeBetween('-30 days') : null;
        $fechaFin = $estado === 'completado' ? $this->faker->dateTimeBetween($fechaInicio ?? 'now') : null;

        return [
            'camionero_id' => Camionero::factory(),
            'vehiculo_id' => Vehiculo::factory(),
            'ruta_id' => Ruta::factory(),
            'estado' => $estado,
            'fecha_inicio' => $fechaInicio,
            'fecha_fin' => $fechaFin,
            'notas' => $this->faker->boolean(30) ? $this->faker->sentence() : null,
        ];
    }

    public function pendiente(): static
    {
        return $this->state(['estado' => 'pendiente', 'fecha_inicio' => null, 'fecha_fin' => null]);
    }

    public function enCurso(): static
    {
        return $this->state(['estado' => 'en_curso', 'fecha_inicio' => now(), 'fecha_fin' => null]);
    }

    public function completado(): static
    {
        return $this->state([
            'estado' => 'completado',
            'fecha_inicio' => now()->subDays(2),
            'fecha_fin' => now(),
        ]);
    }
}
