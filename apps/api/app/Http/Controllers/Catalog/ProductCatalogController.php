<?php

namespace App\Http\Controllers\Catalog;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ProductCatalogController extends Controller
{
    use ApiResponse;

    /**
     * GET /api/v1/catalog/products
     * Katalog pencarian publik
     */
    public function index(Request $request): JsonResponse
    {
        $query = Product::with(['farmer', 'category'])
            ->published()
            ->whereHas('farmer', function ($q) {
                // Pastikan langganan petani tidak kadaluarsa/diblokir jika fitur ini diaktifkan
                // Untuk sekarang kita asumsikan semua petani yang ada bisa tampil.
            });

        // 1. Pencarian teks (Full Text Search)
        if ($search = $request->query('q')) {
            // Menggunakan pg_trgm atau ilike untuk pencarian sederhana
            $query->where(function($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('description', 'ilike', "%{$search}%")
                  ->orWhereRaw("tags::text ilike ?", ["%{$search}%"]);
            });
        }

        // 2. Filter Kategori
        if ($categorySlug = $request->query('category')) {
            $query->whereHas('category', function($q) use ($categorySlug) {
                $q->where('slug', $categorySlug)
                  ->orWhereHas('parent', fn($sq) => $sq->where('slug', $categorySlug));
            });
        }

        // 3. Filter Lokasi (Provinsi/Kota)
        if ($province = $request->query('province')) {
            $query->whereHas('farmer', fn($q) => $q->where('province', $province));
        }

        // 4. Harga Minimum / Maksimum
        if ($minPrice = $request->query('min_price')) {
            $query->where('retail_price', '>=', $minPrice);
        }
        if ($maxPrice = $request->query('max_price')) {
            $query->where('retail_price', '<=', $maxPrice);
        }

        // 5. Sorting
        $sort = $request->query('sort', 'popular');
        match ($sort) {
            'price_asc'  => $query->orderBy('retail_price', 'asc'),
            'price_desc' => $query->orderBy('retail_price', 'desc'),
            'newest'     => $query->orderBy('created_at', 'desc'),
            'rating'     => $query->orderBy('average_rating', 'desc'),
            default      => $query->orderByDesc('is_featured') // 'popular'
                                  ->orderByRaw("CASE WHEN is_featured = true AND featured_until > NOW() THEN 1 ELSE 0 END DESC")
                                  ->orderByDesc('sold_count')
                                  ->orderByDesc('average_rating'),
        };

        $paginator = $query->paginate((int) $request->query('per_page', 24));

        return $this->paginated($paginator);
    }

    /**
     * GET /api/v1/catalog/products/{farmerSlug}/{productSlug}
     * Detail produk publik
     */
    public function show(string $farmerSlug, string $productSlug): JsonResponse
    {
        $product = Product::with(['farmer.user', 'category', 'reviews' => function($q) {
                $q->where('is_published', true)->latest()->limit(5)->with('reviewer:id,name,avatar_url');
            }])
            ->whereHas('farmer', fn($q) => $q->where('slug', $farmerSlug))
            ->where('slug', $productSlug)
            ->published()
            ->first();

        if (!$product) {
            return $this->notFound('Produk tidak ditemukan atau sudah tidak tersedia.');
        }

        // Increment view count secara asinkron atau langsung
        $product->increment('view_count');

        return $this->success($product);
    }

    /**
     * GET /api/v1/catalog/categories
     * Daftar kategori tree (dicache)
     */
    public function categories(): JsonResponse
    {
        // Cache kategori selama 24 jam karena jarang berubah
        $categories = Cache::remember('product_categories_tree', 86400, function () {
            return ProductCategory::whereNull('parent_id')
                ->with(['children' => fn($q) => $q->orderBy('sort_order')])
                ->orderBy('sort_order')
                ->get();
        });

        return $this->success($categories);
    }
}
