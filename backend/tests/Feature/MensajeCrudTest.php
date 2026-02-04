<?php

namespace Tests\Feature;

use App\Models\Mensaje;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class MensajeCrudTest extends TestCase
{
    use RefreshDatabase;

    private function userConToken(string $role = 'camionero'): array
    {
        $user = User::factory()->create(['role' => $role]);
        $token = $user->createToken('test')->plainTextToken;
        return [$user, $token];
    }

    // ── Enviar mensaje ────────────────────────────────────────────────────────

    #[Test]
    public function enviar_mensaje_requiere_autenticacion(): void
    {
        $this->postJson('/api/v1/mensajes', [])->assertUnauthorized();
    }

    #[Test]
    public function puede_enviar_mensaje(): void
    {
        [$remitente, $token] = $this->userConToken();
        [$destinatario] = $this->userConToken('admin');

        $response = $this->withToken($token)->postJson('/api/v1/mensajes', [
            'para_user_id' => $destinatario->id,
            'contenido'    => 'Hola, ¿cómo estás?',
        ]);

        $response->assertCreated()
            ->assertJsonPath('status', 'ok')
            ->assertJsonPath('data.contenido', 'Hola, ¿cómo estás?')
            ->assertJsonPath('data.leido', false);

        $this->assertDatabaseHas('mensajes', [
            'de_user_id'   => $remitente->id,
            'para_user_id' => $destinatario->id,
            'contenido'    => 'Hola, ¿cómo estás?',
        ]);
    }

    #[Test]
    public function no_puede_enviarse_mensaje_a_si_mismo(): void
    {
        [$user, $token] = $this->userConToken();

        $this->withToken($token)->postJson('/api/v1/mensajes', [
            'para_user_id' => $user->id,
            'contenido'    => 'Mensaje a mí mismo',
        ])->assertUnprocessable();
    }

    #[Test]
    public function no_puede_enviarse_mensaje_a_usuario_inexistente(): void
    {
        [, $token] = $this->userConToken();

        $this->withToken($token)->postJson('/api/v1/mensajes', [
            'para_user_id' => 9999,
            'contenido'    => 'Mensaje',
        ])->assertUnprocessable();
    }

    #[Test]
    public function contenido_es_obligatorio(): void
    {
        [$remitente, $token] = $this->userConToken();
        [$destinatario] = $this->userConToken('admin');

        $this->withToken($token)->postJson('/api/v1/mensajes', [
            'para_user_id' => $destinatario->id,
        ])->assertUnprocessable();
    }

    #[Test]
    public function contenido_no_puede_superar_2000_caracteres(): void
    {
        [$remitente, $token] = $this->userConToken();
        [$destinatario] = $this->userConToken('admin');

        $this->withToken($token)->postJson('/api/v1/mensajes', [
            'para_user_id' => $destinatario->id,
            'contenido'    => str_repeat('a', 2001),
        ])->assertUnprocessable();
    }

    // ── Conversación ─────────────────────────────────────────────────────────

    #[Test]
    public function puede_ver_conversacion_entre_dos_usuarios(): void
    {
        [$user1, $token1] = $this->userConToken();
        [$user2] = $this->userConToken('admin');
        [$user3] = $this->userConToken();

        // Mensajes entre user1 y user2
        Mensaje::factory()->create(['de_user_id' => $user1->id, 'para_user_id' => $user2->id]);
        Mensaje::factory()->create(['de_user_id' => $user2->id, 'para_user_id' => $user1->id]);
        // Mensaje de user3 que NO debe aparecer
        Mensaje::factory()->create(['de_user_id' => $user3->id, 'para_user_id' => $user1->id]);

        $response = $this->withToken($token1)
            ->getJson("/api/v1/mensajes/conversacion/{$user2->id}");

        $response->assertOk()
            ->assertJsonPath('status', 'ok')
            ->assertJsonCount(2, 'data');
    }

    #[Test]
    public function ver_conversacion_requiere_autenticacion(): void
    {
        $this->getJson('/api/v1/mensajes/conversacion/1')->assertUnauthorized();
    }

    // ── No leídos ─────────────────────────────────────────────────────────────

    #[Test]
    public function puede_ver_mensajes_no_leidos(): void
    {
        [$user, $token] = $this->userConToken();
        [$otro] = $this->userConToken('admin');

        Mensaje::factory()->count(3)->create([
            'para_user_id' => $user->id,
            'de_user_id'   => $otro->id,
            'leido'        => false,
        ]);
        Mensaje::factory()->leido()->create([
            'para_user_id' => $user->id,
            'de_user_id'   => $otro->id,
        ]);

        $response = $this->withToken($token)->getJson('/api/v1/mensajes/no-leidos');

        $response->assertOk()
            ->assertJsonPath('status', 'ok')
            ->assertJsonCount(3, 'data');
    }

    #[Test]
    public function no_leidos_requiere_autenticacion(): void
    {
        $this->getJson('/api/v1/mensajes/no-leidos')->assertUnauthorized();
    }

    // ── Marcar como leído ─────────────────────────────────────────────────────

    #[Test]
    public function puede_marcar_mensajes_como_leidos(): void
    {
        [$user, $token] = $this->userConToken();
        [$otro] = $this->userConToken('admin');

        Mensaje::factory()->count(2)->create([
            'de_user_id'   => $otro->id,
            'para_user_id' => $user->id,
            'leido'        => false,
        ]);

        $response = $this->withToken($token)
            ->patchJson("/api/v1/mensajes/leidos/{$otro->id}");

        $response->assertOk()
            ->assertJsonPath('status', 'ok')
            ->assertJsonPath('data.actualizados', 2);

        $this->assertDatabaseMissing('mensajes', [
            'de_user_id'   => $otro->id,
            'para_user_id' => $user->id,
            'leido'        => false,
        ]);
    }

    #[Test]
    public function marcar_leidos_requiere_autenticacion(): void
    {
        $this->patchJson('/api/v1/mensajes/leidos/1')->assertUnauthorized();
    }
}
