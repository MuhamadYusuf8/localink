<?php

namespace App\Http\Middleware;

use App\Traits\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware EnsureUserRole
 * Memastikan pengguna yang terautentikasi memiliki role yang sesuai
 *
 * Contoh penggunaan di routes:
 *   Route::middleware(['auth:sanctum', 'role:farmer'])->group(...)
 *   Route::middleware(['auth:sanctum', 'role:farmer,admin'])->group(...)
 */
class EnsureUserRole
{
    use ApiResponse;

    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        // Pastikan user terautentikasi (backup dari auth:sanctum)
        if (!$user) {
            return response()->json([
                'success' => false,
                'error'   => [
                    'code'    => 'UNAUTHORIZED',
                    'message' => 'Autentikasi diperlukan.',
                ],
            ], 401);
        }

        // Cek apakah role user ada dalam daftar role yang diizinkan
        if (!in_array($user->role, $roles, true)) {
            return response()->json([
                'success' => false,
                'error'   => [
                    'code'    => 'FORBIDDEN',
                    'message' => sprintf(
                        'Akses ditolak. Halaman ini hanya untuk: %s.',
                        implode(' atau ', $roles)
                    ),
                ],
            ], 403);
        }

        return $next($request);
    }
}
