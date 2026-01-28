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
        Schema::create('viajes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('camionero_id')->constrained()->onDelete('cascade');
            $table->foreignId('vehiculo_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('ruta_id')->nullable()->constrained()->onDelete('set null');
            $table->enum('estado', ['pendiente', 'en_curso', 'completado', 'cancelado'])->default('pendiente');
            $table->timestamp('fecha_inicio')->nullable();
            $table->timestamp('fecha_fin')->nullable();
            $table->text('notas')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('viajes');
    }
};
