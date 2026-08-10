<?php

namespace Database\Seeders;

use App\Models\TipoMaterial;
use Illuminate\Database\Seeder;

class TipoMaterialSeeder extends Seeder
{
    public function run(): void
    {
        $tipos = [
            'Palets',
            'Granel',
            'Frigorífico',
            'Líquidos',
            'Maquinaria',
            'Peligroso (ADR)',
            'Groupage',
            'Contenedor',
        ];

        foreach ($tipos as $nombre) {
            TipoMaterial::firstOrCreate(['nombre' => $nombre]);
        }
    }
}
