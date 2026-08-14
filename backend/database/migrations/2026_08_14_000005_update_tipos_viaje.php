<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Renombrar los tipos existentes a los nuevos valores
        DB::table('viajes')->where('tipo', 'carga')->update(['tipo' => 'carga_completa']);
        DB::table('viajes')->where('tipo', 'descarga')->update(['tipo' => 'descarga_completa']);
        DB::table('viajes')->where('tipo', 'adelantar_carga')->update(['tipo' => 'dormir']);
    }

    public function down(): void
    {
        DB::table('viajes')->where('tipo', 'carga_completa')->update(['tipo' => 'carga']);
        DB::table('viajes')->where('tipo', 'descarga_completa')->update(['tipo' => 'descarga']);
        DB::table('viajes')->where('tipo', 'dormir')->update(['tipo' => 'adelantar_carga']);
    }
};
