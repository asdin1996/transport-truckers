<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class GestorController extends Controller
{
    public function index(): JsonResponse
    {
        $usuarios = User::with('almacenes')
            ->whereIn('role', ['admin', 'gestor'])
            ->orderBy('name')
            ->get()
            ->map(fn($u) => [
                'id'        => $u->id,
                'name'      => $u->name,
                'email'     => $u->email,
                'role'      => $u->role,
                'almacenes' => $u->almacenes->map(fn($a) => ['id' => $a->id, 'nombre' => $a->nombre]),
            ]);

        return response()->json(['status' => 'ok', 'data' => $usuarios, 'message' => null]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'        => 'required|string|max:255',
            'email'       => 'required|email|unique:users,email',
            'password'    => 'required|string|min:8',
            'role'        => 'required|in:admin,gestor',
            'almacen_ids' => 'nullable|array',
            'almacen_ids.*' => 'exists:almacenes,id',
        ]);

        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => Hash::make($data['password']),
            'role'     => $data['role'],
        ]);

        if (!empty($data['almacen_ids'])) {
            $user->almacenes()->sync($data['almacen_ids']);
        }

        $user->load('almacenes');

        return response()->json([
            'status'  => 'ok',
            'data'    => [
                'id'        => $user->id,
                'name'      => $user->name,
                'email'     => $user->email,
                'role'      => $user->role,
                'almacenes' => $user->almacenes->map(fn($a) => ['id' => $a->id, 'nombre' => $a->nombre]),
            ],
            'message' => 'Usuario creado.',
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $data = $request->validate([
            'name'          => 'sometimes|string|max:255',
            'email'         => 'sometimes|email|unique:users,email,' . $id,
            'password'      => 'nullable|string|min:8',
            'role'          => 'sometimes|in:admin,gestor',
            'almacen_ids'   => 'nullable|array',
            'almacen_ids.*' => 'exists:almacenes,id',
        ]);

        $user->fill([
            'name'  => $data['name']  ?? $user->name,
            'email' => $data['email'] ?? $user->email,
            'role'  => $data['role']  ?? $user->role,
        ]);

        if (!empty($data['password'])) {
            $user->password = Hash::make($data['password']);
        }

        $user->save();
        $user->almacenes()->sync($data['almacen_ids'] ?? []);
        $user->load('almacenes');

        return response()->json([
            'status'  => 'ok',
            'data'    => [
                'id'        => $user->id,
                'name'      => $user->name,
                'email'     => $user->email,
                'role'      => $user->role,
                'almacenes' => $user->almacenes->map(fn($a) => ['id' => $a->id, 'nombre' => $a->nombre]),
            ],
            'message' => 'Usuario actualizado.',
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        // No permitir eliminar el propio usuario
        if ($user->id === auth()->id()) {
            return response()->json([
                'status'  => 'error',
                'message' => 'No puedes eliminar tu propio usuario.',
                'data'    => null,
            ], 422);
        }

        $user->almacenes()->detach();
        $user->delete();

        return response()->json(['status' => 'ok', 'data' => null, 'message' => 'Usuario eliminado.']);
    }
}
