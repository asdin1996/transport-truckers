<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        User::factory()->create([
            'name' => 'Administrador',
            'email' => 'admin@camioneros.com',
            'role' => 'admin',
        ]);

        $this->call([
            EmpresaSeeder::class,
            VehiculoSeeder::class,
            RutaSeeder::class,
            CamioneroSeeder::class,
            ViajeSeeder::class,
            GastoSeeder::class,
            DocumentoSeeder::class,
            MensajeSeeder::class,
            UbicacionSeeder::class,
        ]);
    }
}
