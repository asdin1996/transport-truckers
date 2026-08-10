<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        if (! $request->user()) {
            return response()->json([
                'status' => 'error',
                'message' => 'No autenticado.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        $userRole   = $request->user()->role;
        $allowedRoles = $roles;

        // gestor tiene acceso a todo lo que admin tiene acceso, excepto si se especifica explícitamente
        if ($userRole === 'gestor' && in_array('admin', $allowedRoles)) {
            $allowedRoles[] = 'gestor';
        }

        if (! in_array($userRole, $allowedRoles)) {
            return response()->json([
                'status' => 'error',
                'message' => 'No tienes permiso para acceder a este recurso.',
            ], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}
