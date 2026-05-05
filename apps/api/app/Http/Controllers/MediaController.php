<?php

namespace App\Http\Controllers;

use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MediaController extends Controller
{
    use ApiResponse;

    /**
     * POST /api/v1/media/upload
     * Upload single image and return URL
     */
    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'image', 'mimes:jpeg,png,jpg,webp', 'max:5120'], // Max 5MB
            'folder' => ['nullable', 'string', 'in:products,avatars,banners'],
        ]);

        try {
            $file   = $request->file('file');
            $folder = $request->input('folder', 'misc');
            
            // Generate filename: timestamp + random slug
            $name = time() . '_' . Str::random(10) . '.' . $file->getClientOriginalExtension();
            
            // Store to public disk
            $path = $file->storeAs($folder, $name, 'public');
            
            // Get URL
            $url = Storage::disk('public')->url($path);

            return $this->success([
                'url'      => $url,
                'path'     => $path,
                'filename' => $name,
                'size'     => $file->getSize(),
                'mime'     => $file->getClientMimeType(),
            ], 'File berhasil diunggah.');
            
        } catch (\Exception $e) {
            logger()->error('Media upload failed', ['error' => $e->getMessage()]);
            return $this->serverError('Gagal mengunggah file.');
        }
    }
}
