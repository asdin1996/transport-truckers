<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Ampliar el ENUM de role para incluir 'gestor'
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin','camionero','maps','gestor') NOT NULL DEFAULT 'camionero'");
    }

    public function down(): void
    {
        // Antes de revertir, convertir posibles gestores a camionero para no violar el ENUM
        DB::statement("UPDATE users SET role = 'camionero' WHERE role = 'gestor'");
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin','camionero','maps') NOT NULL DEFAULT 'camionero'");
    }
};
