<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('viajes', function (Blueprint $table) {
            $table->timestamp('hora_inicio')->nullable()->after('fecha_fin');
            $table->timestamp('hora_fin')->nullable()->after('hora_inicio');
            $table->unsignedInteger('duracion_minutos')->nullable()->after('hora_fin');
        });
    }

    public function down(): void
    {
        Schema::table('viajes', function (Blueprint $table) {
            $table->dropColumn(['hora_inicio', 'hora_fin', 'duracion_minutos']);
        });
    }
};
