<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('viajes', function (Blueprint $table) {
            // Orden manual dentro de los viajes pendientes de un mismo camionero
            // NULL = sin orden explícito (se ordena por fecha_inicio)
            $table->unsignedSmallInteger('orden')->nullable()->after('estado');
        });
    }

    public function down(): void
    {
        Schema::table('viajes', function (Blueprint $table) {
            $table->dropColumn('orden');
        });
    }
};
