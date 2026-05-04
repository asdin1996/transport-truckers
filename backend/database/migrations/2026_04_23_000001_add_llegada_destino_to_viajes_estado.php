<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE viajes MODIFY COLUMN estado ENUM('pendiente','en_camino','llegada_destino','cargando','descargando','finalizado','cancelado') NOT NULL DEFAULT 'pendiente'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE viajes MODIFY COLUMN estado ENUM('pendiente','en_camino','cargando','descargando','finalizado','cancelado') NOT NULL DEFAULT 'pendiente'");
    }
};
