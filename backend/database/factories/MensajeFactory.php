<?php

namespace Database\Factories;

use App\Models\Mensaje;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Mensaje>
 */
class MensajeFactory extends Factory
{
    public function definition(): array
    {
        return [
            'de_user_id' => User::factory(),
            'para_user_id' => User::factory(),
            'contenido' => $this->faker->sentence(),
            'leido' => false,
            'leido_at' => null,
        ];
    }

    public function leido(): static
    {
        return $this->state([
            'leido' => true,
            'leido_at' => now(),
        ]);
    }
}
