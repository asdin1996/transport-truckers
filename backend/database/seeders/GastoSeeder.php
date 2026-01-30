<?php

namespace Database\Seeders;

use App\Models\Gasto;
use Illuminate\Database\Seeder;

class GastoSeeder extends Seeder
{
    public function run(): void
    {
        Gasto::factory()->count(10)->create();
    }
}
