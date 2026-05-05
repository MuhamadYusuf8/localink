<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;

/**
 * Trait ApiResponse — respons API terstandarisasi sesuai JSON:API spec
 * Digunakan oleh semua Controller dan Handler
 */
trait ApiResponse
{
    /**
     * Respons sukses dengan data
     */
    protected function success(
        mixed $data,
        string $message = '',
        int $statusCode = 200,
        array $meta = []
    ): JsonResponse {
        $response = [
            'success' => true,
            'data'    => $data,
        ];

        if (!empty($message)) {
            $response['message'] = $message;
        }

        if (!empty($meta)) {
            $response['meta'] = $meta;
        }

        return response()->json($response, $statusCode);
    }

    /**
     * Respons sukses untuk pembuatan resource (201 Created)
     */
    protected function created(mixed $data, string $message = 'Berhasil dibuat'): JsonResponse
    {
        return $this->success($data, $message, 201);
    }

    /**
     * Respons untuk aksi tanpa konten (204 No Content)
     */
    protected function noContent(): JsonResponse
    {
        return response()->json(null, 204);
    }

    /**
     * Respons error terstandarisasi
     */
    protected function error(
        string $message,
        string $code = 'ERROR',
        int $statusCode = 400,
        array $details = []
    ): JsonResponse {
        $error = [
            'code'    => $code,
            'message' => $message,
        ];

        if (!empty($details)) {
            $error['details'] = $details;
        }

        return response()->json([
            'success' => false,
            'error'   => $error,
        ], $statusCode);
    }

    /**
     * Respons 401 Unauthorized
     */
    protected function unauthorized(string $message = 'Sesi tidak valid atau telah berakhir'): JsonResponse
    {
        return $this->error($message, 'UNAUTHORIZED', 401);
    }

    /**
     * Respons 403 Forbidden
     */
    protected function forbidden(string $message = 'Anda tidak memiliki akses ke resource ini'): JsonResponse
    {
        return $this->error($message, 'FORBIDDEN', 403);
    }

    /**
     * Respons 404 Not Found
     */
    protected function notFound(string $message = 'Data tidak ditemukan'): JsonResponse
    {
        return $this->error($message, 'NOT_FOUND', 404);
    }

    /**
     * Respons 422 Validation Error
     */
    protected function validationError(array $errors, string $message = 'Data tidak valid'): JsonResponse
    {
        return response()->json([
            'success' => false,
            'error'   => [
                'code'    => 'VALIDATION_ERROR',
                'message' => $message,
                'details' => $errors,
            ],
        ], 422);
    }

    /**
     * Respons 500 Server Error
     */
    protected function serverError(string $message = 'Terjadi kesalahan pada server'): JsonResponse
    {
        return $this->error($message, 'SERVER_ERROR', 500);
    }

    /**
     * Format data paginator Laravel ke struktur meta standar
     */
    protected function paginated(mixed $paginator, callable $transform = null): JsonResponse
    {
        $items = $transform
            ? $paginator->getCollection()->map($transform)
            : $paginator->items();

        return $this->success($items, meta: [
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
                'from'         => $paginator->firstItem(),
                'to'           => $paginator->lastItem(),
            ],
        ]);
    }
}
