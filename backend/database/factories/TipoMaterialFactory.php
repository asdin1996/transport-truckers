<?php

namespace Database\Factories;

use App\Models\TipoMaterial;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TipoMaterial>
 */
class TipoMaterialFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'nombre' => $this->faker->unique()->words(2, true),
        ];
    }
}
