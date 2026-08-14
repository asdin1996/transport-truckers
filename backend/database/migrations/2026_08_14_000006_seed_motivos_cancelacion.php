<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();
        $motivos = [
            'Error en creación',
            'Proveedor sin mercancía',
            'Urgencia otro cliente',
            'Pedido cancelado',
        ];

        foreach ($motivos as $nombre) {
            DB::table('motivos_cancelacion')->insertOrIgnore([
                'nombre'     => $nombre,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        DB::table('motivos_cancelacion')->whereIn('nombre', [
            'Error en creación',
            'Proveedor sin mercancía',
            'Urgencia otro cliente',
            'Pedido cancelado',
        ])->delete();
    }
};
