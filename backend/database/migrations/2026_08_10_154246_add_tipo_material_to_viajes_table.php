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
            $table->foreignId('tipo_material_id')
                  ->nullable()
                  ->after('tipo')
                  ->constrained('tipos_material')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('viajes', function (Blueprint $table) {
            $table->dropForeignIdFor(\App\Models\TipoMaterial::class);
            $table->dropColumn('tipo_material_id');
        });
    }
};
