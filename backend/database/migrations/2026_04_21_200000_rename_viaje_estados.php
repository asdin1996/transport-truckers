<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('viajes')->where('estado', 'en_curso')->update(['estado' => 'en_camino']);
        DB::table('viajes')->where('estado', 'completado')->update(['estado' => 'finalizado']);
    }

    public function down(): void
    {
        DB::table('viajes')->where('estado', 'en_camino')->update(['estado' => 'en_curso']);
        DB::table('viajes')->where('estado', 'finalizado')->update(['estado' => 'completado']);
    }
};
