<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('camioneros', function (Blueprint $table) {
            $table->foreignId('almacen_id')
                  ->nullable()
                  ->after('user_id')
                  ->constrained('almacenes')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('camioneros', function (Blueprint $table) {
            $table->dropForeignIdFor(\App\Models\Almacen::class);
            $table->dropColumn('almacen_id');
        });
    }
};
