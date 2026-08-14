<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('viajes', function (Blueprint $table) {
            $table->foreignId('organizacion_contratante_id')
                ->nullable()
                ->after('tipo_material_id')
                ->constrained('organizaciones_contratantes')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('viajes', function (Blueprint $table) {
            $table->dropForeign(['organizacion_contratante_id']);
            $table->dropColumn('organizacion_contratante_id');
        });
    }
};
