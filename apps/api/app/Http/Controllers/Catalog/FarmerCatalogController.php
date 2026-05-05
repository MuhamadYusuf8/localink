<?php

namespace App\Http\Controllers\Catalog;

use App\Http\Controllers\Controller;
use App\Models\FarmerProfile;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
class FarmerCatalogController extends Controller
{
    use ApiResponse;

    /**
     * GET /api/v1/catalog/farmers
     */
    public function index(Request $request): JsonResponse
    {
        $query = FarmerProfile::with(['user:id,name,avatar_url'])
            ->whereHas('products', fn($q) => $q->published()); // Hanya petani yang punya produk aktif

        if ($province = $request->query('province')) {
            $query->where('province', $province);
        }

        if ($search = $request->query('q')) {
            $query->where('store_name', 'ilike', "%{$search}%");
        }

        $query->orderByDesc('is_premium')
              ->orderByDesc('total_sales')
              ->orderByDesc('average_rating');

        return $this->paginated($query->paginate(20));
    }

    /**
     * GET /api/v1/catalog/farmers/{slug}
     */
    public function show(string $slug): JsonResponse
    {
        $farmer = FarmerProfile::with(['user:id,name,avatar_url', 'products' => function($q) {
            $q->published()->latest()->limit(12);
        }])->where('slug', $slug)->first();

        if (!$farmer) return $this->notFound('Profil petani tidak ditemukan.');

        return $this->success($farmer);
    }

    /**
     * GET /api/v1/catalog/farmers/nearby?lat=-6.2&lng=106.8&radius_km=25
     * Cari petani terdekat berdasarkan koordinat (menggunakan perhitungan jarak sederhana).
     */
    public function nearby(Request $request): JsonResponse
    {
        $lat = $request->query('lat');
        $lng = $request->query('lng');
        $radiusKm = (float) ($request->query('radius_km', 25));

        // Fallback kalau user belum share lokasi: tampilkan yang premium + terlaris
        if (!$lat || !$lng) {
            $fallback = FarmerProfile::with(['user:id,name,avatar_url'])
                ->whereHas('products', fn($q) => $q->published())
                ->orderByDesc('is_premium')
                ->orderByDesc('total_sales')
                ->orderByDesc('average_rating')
                ->paginate(20);

            return $this->paginated($fallback);
        }

        $lat = (float) $lat;
        $lng = (float) $lng;

        // SQLite dev fallback: fungsi trig (radians/acos) tidak tersedia default -> fallback ke rekomendasi tanpa jarak.
        if (DB::getDriverName() === 'sqlite') {
            $fallback = FarmerProfile::with(['user:id,name,avatar_url'])
                ->whereHas('products', fn($q) => $q->published())
                ->whereNotNull('latitude')
                ->whereNotNull('longitude')
                ->orderByDesc('is_premium')
                ->orderByDesc('total_sales')
                ->orderByDesc('average_rating')
                ->paginate(20);

            return $this->paginated($fallback);
        }

        // Rumus Haversine (km). Aman untuk Postgres.
        $distanceSql = "(
            6371 * acos(
                cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?))
                + sin(radians(?)) * sin(radians(latitude))
            )
        )";

        $query = FarmerProfile::query()
            ->select('farmer_profiles.*')
            ->selectRaw("$distanceSql AS distance_km", [$lat, $lng, $lat])
            ->with(['user:id,name,avatar_url'])
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->whereHas('products', fn($q) => $q->published())
            ->whereRaw("$distanceSql <= ?", [$lat, $lng, $lat, max(1, $radiusKm)])
            ->orderByRaw('distance_km ASC')
            ->orderByDesc('is_premium')
            ->orderByDesc('average_rating');

        return $this->paginated($query->paginate(20));
    }
}
