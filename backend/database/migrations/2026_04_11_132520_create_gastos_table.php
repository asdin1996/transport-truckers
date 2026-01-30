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
        Schema::create('gastos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('viaje_id')->constrained()->onDelete('cascade');
            $table->enum('tipo', ['combustible', 'dieta', 'peaje', 'otro']);
            $table->decimal('importe', 10, 2);
            $table->string('descripcion')->nullable();
            $table->date('fecha');
            $table->string('foto_ticket')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gastos');
    }
};
