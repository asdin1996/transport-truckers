<?php

namespace Database\Seeders;

use App\Models\Viaje;
use Illuminate\Database\Seeder;

class ViajeSeeder extends Seeder
{
    public function run(): void
    {
        Viaje::factory()->count(5)->create();
    }
}
