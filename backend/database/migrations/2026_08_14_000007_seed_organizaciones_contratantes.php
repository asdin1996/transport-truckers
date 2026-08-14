<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();
        $organizaciones = ['DLG', 'C74', 'DLG + C4', 'C4I', 'OTROS'];

        foreach ($organizaciones as $nombre) {
            DB::table('organizaciones_contratantes')->insertOrIgnore([
                'nombre'     => $nombre,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        DB::table('organizaciones_contratantes')->whereIn('nombre', [
            'DLG', 'C74', 'DLG + C4', 'C4I', 'OTROS',
        ])->delete();
    }
};
