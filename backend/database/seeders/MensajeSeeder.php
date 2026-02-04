<?php

namespace Database\Seeders;

use App\Models\Mensaje;
use Illuminate\Database\Seeder;

class MensajeSeeder extends Seeder
{
    public function run(): void
    {
        Mensaje::factory()->count(10)->create();
    }
}
