<?php

namespace Database\Factories;

use App\Models\Camionero;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Camionero>
 */
class CamioneroFactory extends Factory
{
    public function definition(): array
    {
        $email = $this->faker->unique()->safeEmail();
        $dni   = strtoupper($this->faker->bothify('########?'));

        return [
            'user_id'          => User::factory()->create([
                'role'     => 'camionero',
                'email'    => $email,
                'password' => bcrypt($dni),
            ])->id,
            'nombre'           => $this->faker->firstName(),
            'apellidos'        => $this->faker->lastName() . ' ' . $this->faker->lastName(),
            'email'            => $email,
            'telefono'         => $this->faker->phoneNumber(),
            'dni'              => $dni,
            'fecha_nacimiento' => $this->faker->dateTimeBetween('-60 years', '-18 years')->format('Y-m-d'),
        ];
    }
}
