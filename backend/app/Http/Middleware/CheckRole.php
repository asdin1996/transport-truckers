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

        if (! in_array($request->user()->role, $roles)) {
            return response()->json([
                'status' => 'error',
                'message' => 'No tienes permiso para acceder a este recurso.',
            ], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}
