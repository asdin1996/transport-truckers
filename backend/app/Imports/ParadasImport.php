<?php

namespace App\Imports;

use App\Models\Parada;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;

class ParadasImport implements ToModel, WithHeadingRow, SkipsEmptyRows
{
    public int $importadas = 0;

    public function model(array $row): ?Parada
    {
        $nombre = trim($row['nombre'] ?? '');

        if (!$nombre) {
            return null;
        }

        if (Parada::withTrashed()->where('nombre', $nombre)->exists()) {
            return null;
        }

        $lat = isset($row['lat']) && $row['lat'] !== '' ? (float) $row['lat'] : null;
        $lng = isset($row['lng']) && $row['lng'] !== '' ? (float) $row['lng'] : null;

        $this->importadas++;

        return new Parada(['nombre' => $nombre, 'lat' => $lat, 'lng' => $lng]);
    }
}
