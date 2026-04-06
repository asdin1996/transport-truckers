<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class AuthController extends Controller
{
    public function login(LoginRequest $request): JsonResponse
    {
        if (! Auth::attempt($request->only('email', 'password'))) {
            return response()->json([
                'status' => 'error',
                'message' => 'Credenciales incorrectas.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        $user = Auth::user();
        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'status' => 'ok',
            'message' => 'Login correcto.',
            'data' => [
                'user' => [
                    'id'           => $user->id,
                    'name'         => $user->name,
                    'email'        => $user->email,
                    'role'         => $user->role,
                    'camionero_id' => $user->camionero?->id,
                ],
                'token' => $token,
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'status' => 'ok',
            'message' => 'Sesión cerrada correctamente.',
            'data' => null,
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'status' => 'ok',
            'message' => null,
            'data' => [
                'id'           => $user->id,
                'name'         => $user->name,
                'email'        => $user->email,
                'role'         => $user->role,
                'camionero_id' => $user->camionero?->id,
            ],
        ]);
    }

    public function contactos(): JsonResponse
    {
        $contactos = \App\Models\User::where('id', '!=', auth()->id())
            ->with('camionero')
            ->get()
            ->map(fn ($u) => [
                'id'     => $u->id,
                'nombre' => $u->camionero
                    ? "{$u->camionero->nombre} {$u->camionero->apellidos}"
                    : $u->name,
                'role'   => $u->role,
            ]);

        return response()->json([
            'status'  => 'ok',
            'message' => null,
            'data'    => $contactos,
        ]);
    }

    public function adminContact(): JsonResponse
    {
        $admin = \App\Models\User::where('role', 'admin')->select('id', 'name')->first();

        if (! $admin) {
            return response()->json([
                'status' => 'error',
                'message' => 'No hay administrador disponible.',
                'data' => null,
            ], Response::HTTP_NOT_FOUND);
        }

        return response()->json([
            'status' => 'ok',
            'message' => null,
            'data' => $admin,
        ]);
    }
}
