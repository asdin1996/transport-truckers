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
        Schema::table('camioneros', function (Blueprint $table) {
            $table->string('dni')->nullable()->change();
            $table->string('telefono')->nullable()->change();
            $table->date('fecha_nacimiento')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('camioneros', function (Blueprint $table) {
            $table->string('dni')->nullable(false)->change();
            $table->string('telefono')->nullable(false)->change();
            $table->date('fecha_nacimiento')->nullable(false)->change();
        });
    }
};
