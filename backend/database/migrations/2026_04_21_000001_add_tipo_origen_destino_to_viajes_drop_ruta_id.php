<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('viajes', function (Blueprint $table) {
            $table->string('tipo')->default('carga')->after('ruta_id');
            $table->string('origen')->nullable()->after('tipo');
            $table->string('destino')->nullable()->after('origen');
            $table->dropForeign(['ruta_id']);
            $table->dropColumn('ruta_id');
        });
    }

    public function down(): void
    {
        Schema::table('viajes', function (Blueprint $table) {
            $table->unsignedBigInteger('ruta_id')->nullable()->after('vehiculo_id');
            $table->foreign('ruta_id')->references('id')->on('rutas');
            $table->dropColumn(['tipo', 'origen', 'destino']);
        });
    }
};
