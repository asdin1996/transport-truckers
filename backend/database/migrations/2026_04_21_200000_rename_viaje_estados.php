<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    public function up(): void
    {
        // Ampliar el ENUM para incluir todos los valores (viejos + nuevos)
        DB::statement("ALTER TABLE viajes MODIFY COLUMN estado ENUM(
            'pendiente','en_curso','completado','cancelado',
            'en_camino','cargando','descargando','finalizado'
        ) NOT NULL DEFAULT 'pendiente'");

        // Migrar datos
        DB::table('viajes')->where('estado', 'en_curso')->update(['estado' => 'en_camino']);
        DB::table('viajes')->where('estado', 'completado')->update(['estado' => 'finalizado']);

        // Dejar solo los valores nuevos
        DB::statement("ALTER TABLE viajes MODIFY COLUMN estado ENUM(
            'pendiente','en_camino','cargando','descargando','finalizado','cancelado'
        ) NOT NULL DEFAULT 'pendiente'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE viajes MODIFY COLUMN estado ENUM(
            'pendiente','en_camino','cargando','descargando','finalizado','cancelado',
            'en_curso','completado'
        ) NOT NULL DEFAULT 'pendiente'");

        DB::table('viajes')->where('estado', 'en_camino')->update(['estado' => 'en_curso']);
        DB::table('viajes')->where('estado', 'finalizado')->update(['estado' => 'completado']);

        DB::statement("ALTER TABLE viajes MODIFY COLUMN estado ENUM(
            'pendiente','en_curso','completado','cancelado'
        ) NOT NULL DEFAULT 'pendiente'");
    }
};
