<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('camioneros', function (Blueprint $table) {
            $table->dropUnique(['licencia']);
            $table->dropColumn('licencia');
            $table->string('dni', 20)->unique()->after('telefono');
        });
    }

    public function down(): void
    {
        Schema::table('camioneros', function (Blueprint $table) {
            $table->dropUnique(['dni']);
            $table->dropColumn('dni');
            $table->string('licencia', 20)->unique()->after('telefono');
        });
    }
};
