<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('viajes', function (Blueprint $table) {
            $table->foreignId('motivo_cancelacion_id')
                ->nullable()
                ->after('estado')
                ->constrained('motivos_cancelacion')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('viajes', function (Blueprint $table) {
            $table->dropForeign(['motivo_cancelacion_id']);
            $table->dropColumn('motivo_cancelacion_id');
        });
    }
};
