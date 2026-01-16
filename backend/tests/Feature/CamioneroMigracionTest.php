<?php

namespace Tests\Feature;

use App\Models\Camionero;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class CamioneroMigracionTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function puede_crear_un_camionero(): void
    {
        $user = User::factory()->create(['role' => 'camionero']);

        $camionero = Camionero::create([
            'user_id' => $user->id,
            'nombre' => 'Juan',
            'apellidos' => 'García López',
            'email' => 'juan@example.com',
            'telefono' => '600123456',
            'licencia' => 'B-1234567890',
            'fecha_nacimiento' => '1985-06-15',
        ]);

        $this->assertDatabaseHas('camioneros', [
            'email' => 'juan@example.com',
            'licencia' => 'B-1234567890',
        ]);
        $this->assertEquals('Juan', $camionero->nombre);
    }

    #[Test]
    public function camionero_pertenece_a_un_user(): void
    {
        $user = User::factory()->create(['role' => 'camionero']);
        $camionero = Camionero::factory()->create(['user_id' => $user->id]);

        $this->assertEquals($user->id, $camionero->user->id);
    }

    #[Test]
    public function user_tiene_un_camionero(): void
    {
        $user = User::factory()->create(['role' => 'camionero']);
        $camionero = Camionero::factory()->create(['user_id' => $user->id]);

        $this->assertEquals($camionero->id, $user->camionero->id);
    }

    #[Test]
    public function soft_delete_no_elimina_fisicamente(): void
    {
        $camionero = Camionero::factory()->create();
        $id = $camionero->id;

        $camionero->delete();

        $this->assertSoftDeleted('camioneros', ['id' => $id]);
        $this->assertNull(Camionero::find($id));
        $this->assertNotNull(Camionero::withTrashed()->find($id));
    }

    #[Test]
    public function email_es_unico(): void
    {
        $this->expectException(\Illuminate\Database\QueryException::class);

        $user1 = User::factory()->create(['role' => 'camionero']);
        $user2 = User::factory()->create(['role' => 'camionero']);

        Camionero::factory()->create(['user_id' => $user1->id, 'email' => 'duplicado@example.com']);
        Camionero::factory()->create(['user_id' => $user2->id, 'email' => 'duplicado@example.com']);
    }

    #[Test]
    public function licencia_es_unica(): void
    {
        $this->expectException(\Illuminate\Database\QueryException::class);

        $user1 = User::factory()->create(['role' => 'camionero']);
        $user2 = User::factory()->create(['role' => 'camionero']);

        Camionero::factory()->create(['user_id' => $user1->id, 'licencia' => 'LIC-DUPLICADA']);
        Camionero::factory()->create(['user_id' => $user2->id, 'licencia' => 'LIC-DUPLICADA']);
    }
}
