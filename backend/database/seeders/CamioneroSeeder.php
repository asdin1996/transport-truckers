<?php

namespace Database\Seeders;

use App\Models\Camionero;
use Illuminate\Database\Seeder;

class CamioneroSeeder extends Seeder
{
    public function run(): void
    {
        Camionero::factory()->count(5)->create();
    }
}
