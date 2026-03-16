<?php

namespace Database\Seeders;

use App\Models\Camionero;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class CamioneroSeeder extends Seeder
{
    public function run(): void
    {
        $camioneros = [
            [
                'nombre'           => 'Carlos',
                'apellidos'        => 'Martínez López',
                'email'            => 'carlos.martinez@camioneros.com',
                'telefono'         => '612 345 678',
                'dni'              => '12345678A',
                'fecha_nacimiento' => '1982-03-15',
            ],
            [
                'nombre'           => 'Alejandro',
                'apellidos'        => 'García Ruiz',
                'email'            => 'alejandro.garcia@camioneros.com',
                'telefono'         => '623 456 789',
                'dni'              => '23456789B',
                'fecha_nacimiento' => '1979-07-22',
            ],
            [
                'nombre'           => 'Manuel',
                'apellidos'        => 'Sánchez Pérez',
                'email'            => 'manuel.sanchez@camioneros.com',
                'telefono'         => '634 567 890',
                'dni'              => '34567890C',
                'fecha_nacimiento' => '1985-11-08',
            ],
            [
                'nombre'           => 'Francisco',
                'apellidos'        => 'Fernández Torres',
                'email'            => 'francisco.fernandez@camioneros.com',
                'telefono'         => '645 678 901',
                'dni'              => '45678901D',
                'fecha_nacimiento' => '1990-04-30',
            ],
            [
                'nombre'           => 'José',
                'apellidos'        => 'González Moreno',
                'email'            => 'jose.gonzalez@camioneros.com',
                'telefono'         => '656 789 012',
                'dni'              => '56789012E',
                'fecha_nacimiento' => '1976-09-14',
            ],
        ];

        foreach ($camioneros as $data) {
            $user = User::create([
                'name'     => $data['nombre'] . ' ' . $data['apellidos'],
                'email'    => $data['email'],
                'password' => Hash::make($data['dni']),
                'role'     => 'camionero',
            ]);

            Camionero::create(array_merge($data, ['user_id' => $user->id]));
        }
    }
}
