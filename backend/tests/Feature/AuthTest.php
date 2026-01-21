<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function camionero_puede_hacer_login(): void
    {
        $user = User::factory()->create([
            'email' => 'camionero@test.com',
            'password' => bcrypt('password123'),
            'role' => 'camionero',
        ]);

        $response = $this->postJson('/api/v1/login', [
            'email' => 'camionero@test.com',
            'password' => 'password123',
        ]);

        $response->assertOk()
            ->assertJsonStructure([
                'status', 'message',
                'data' => ['user' => ['id', 'name', 'email', 'role'], 'token'],
            ])
            ->assertJsonPath('data.user.role', 'camionero');
    }

    #[Test]
    public function admin_puede_hacer_login(): void
    {
        $user = User::factory()->create([
            'email' => 'admin@test.com',
            'password' => bcrypt('password123'),
            'role' => 'admin',
        ]);

        $response = $this->postJson('/api/v1/login', [
            'email' => 'admin@test.com',
            'password' => 'password123',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.user.role', 'admin');
    }

    #[Test]
    public function login_con_credenciales_incorrectas_devuelve_401(): void
    {
        User::factory()->create(['email' => 'user@test.com', 'password' => bcrypt('correcta')]);

        $response = $this->postJson('/api/v1/login', [
            'email' => 'user@test.com',
            'password' => 'incorrecta',
        ]);

        $response->assertUnauthorized()
            ->assertJsonPath('status', 'error');
    }

    #[Test]
    public function login_sin_email_devuelve_422(): void
    {
        $response = $this->postJson('/api/v1/login', [
            'password' => 'password123',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    #[Test]
    public function login_sin_password_devuelve_422(): void
    {
        $response = $this->postJson('/api/v1/login', [
            'email' => 'user@test.com',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['password']);
    }

    #[Test]
    public function usuario_autenticado_puede_hacer_logout(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->postJson('/api/v1/logout');

        $response->assertOk()
            ->assertJsonPath('status', 'ok');

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    #[Test]
    public function logout_sin_autenticar_devuelve_401(): void
    {
        $response = $this->postJson('/api/v1/logout');

        $response->assertUnauthorized();
    }

    #[Test]
    public function me_devuelve_datos_del_usuario_autenticado(): void
    {
        $user = User::factory()->create(['role' => 'camionero']);
        $token = $user->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->getJson('/api/v1/me');

        $response->assertOk()
            ->assertJsonPath('data.email', $user->email)
            ->assertJsonPath('data.role', 'camionero');
    }

    #[Test]
    public function middleware_role_bloquea_rol_incorrecto(): void
    {
        Route::middleware(['auth:sanctum', 'role:admin'])
            ->get('/test-admin-only', fn () => response()->json(['ok' => true]));

        $camionero = User::factory()->create(['role' => 'camionero']);
        $token = $camionero->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->getJson('/test-admin-only');

        $response->assertForbidden();
    }

    #[Test]
    public function middleware_role_permite_rol_correcto(): void
    {
        Route::middleware(['auth:sanctum', 'role:admin'])
            ->get('/test-admin-only', fn () => response()->json(['ok' => true]));

        $admin = User::factory()->create(['role' => 'admin']);
        $token = $admin->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->getJson('/test-admin-only');

        $response->assertOk();
    }
}
