<?php

namespace App\Imports;

use App\Models\TipoMaterial;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;

class TiposMaterialImport implements ToModel, WithHeadingRow, SkipsEmptyRows
{
    public int $importados = 0;

    public function model(array $row): ?TipoMaterial
    {
        $nombre = trim($row['nombre'] ?? '');

        if (!$nombre) {
            return null;
        }

        if (TipoMaterial::withTrashed()->where('nombre', $nombre)->exists()) {
            return null;
        }

        $this->importados++;

        return new TipoMaterial(['nombre' => $nombre]);
    }
}
