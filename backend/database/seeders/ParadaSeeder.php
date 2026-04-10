<?php

namespace Database\Seeders;

use App\Models\Parada;
use Illuminate\Database\Seeder;

class ParadaSeeder extends Seeder
{
    public function run(): void
    {
        $paradas = [
            'Madrid - Mercamadrid',
            'Barcelona - Zona Franca',
            'Valencia - Puerto',
            'Sevilla - Polígono Calonge',
            'Zaragoza - Plaza',
            'Málaga - Puerto',
            'Bilbao - Puerto',
            'Alicante - Terminal',
        ];

        foreach ($paradas as $nombre) {
            Parada::firstOrCreate(['nombre' => $nombre]);
        }
    }
}
