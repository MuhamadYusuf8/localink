<?php

namespace App\Services;

use App\DTOs\CreateProductDTO;
use App\Models\FarmerProfile;
use App\Models\MarketPrice;
use App\Models\Product;
use App\Models\User;
use App\Repositories\Contracts\ProductRepositoryInterface;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Str;

/**
 * ProductService — logika bisnis manajemen produk petani
 */
class ProductService
{
    public function __construct(
        private readonly ProductRepositoryInterface $productRepository,
    ) {}

    /**
     * Buat produk baru milik petani
     * Memvalidasi kepemilikan, generate slug, set status
     */
    public function createProduct(User $farmer, CreateProductDTO $dto): Product
    {
        $farmerProfile = $farmer->farmerProfile;
        if (!$farmerProfile) {
            throw new \DomainException('Profil petani tidak ditemukan.');
        }

        // Cek batas produk berdasarkan tier langganan
        $this->enforceProductLimit($farmerProfile);

        // Generate slug unik dalam scope petani ini
        $slug = $this->generateUniqueProductSlug($farmerProfile->id, $dto->name);

        $data = [
            'farmer_id'        => $farmerProfile->id,
            'category_id'      => $dto->categoryId,
            'name'             => $dto->name,
            'slug'             => $slug,
            'description'      => $dto->description,
            'unit'             => $dto->unit,
            'retail_price'     => $dto->retailPrice,
            'wholesale_price'  => $dto->wholesalePrice,
            'wholesale_min_qty'=> $dto->wholesaleMinQty,
            'stock_qty'        => $dto->stockQty,
            'images'           => $dto->images,
            'is_published'     => $dto->isPublished,
            'harvest_date'     => $dto->harvestDate,
            'available_from'   => $dto->availableFrom,
            'tags'             => $dto->tags,
            'weight_per_unit'  => $dto->weightPerUnit,
            'status'           => $dto->stockQty > 0
                ? ($dto->isPublished ? 'active' : 'draft')
                : 'out_of_stock',
        ];

        return $this->productRepository->create($data);
    }

    /**
     * Perbarui produk yang sudah ada
     * Validasi kepemilikan via ProductPolicy
     */
    public function updateProduct(User $farmer, string $productId, array $data): Product
    {
        $product = $this->productRepository->findById($productId);
        if (!$product) {
            throw new \DomainException('Produk tidak ditemukan.');
        }

        $this->assertOwnership($farmer, $product);

        // Jika harga grosir diisi, pastikan minimum qty juga diisi
        if (isset($data['wholesale_price']) && $data['wholesale_price'] > 0) {
            if (empty($data['wholesale_min_qty']) || $data['wholesale_min_qty'] < 1) {
                throw new \InvalidArgumentException('Minimum kuantitas grosir wajib diisi saat harga grosir aktif.');
            }
        }

        // Perbarui status berdasarkan stok dan publikasi
        if (isset($data['stock_qty'])) {
            $data['status'] = match(true) {
                (int) $data['stock_qty'] === 0 => 'out_of_stock',
                ($data['is_published'] ?? $product->is_published) => 'active',
                default => 'draft',
            };
        }

        return $this->productRepository->update($product, $data);
    }

    /**
     * Toggle status publikasi produk (aktif ↔ draft)
     */
    public function togglePublish(User $farmer, string $productId): Product
    {
        $product = $this->productRepository->findById($productId);
        if (!$product) {
            throw new \DomainException('Produk tidak ditemukan.');
        }
        $this->assertOwnership($farmer, $product);

        $newPublished = !$product->is_published;
        $newStatus    = $newPublished && $product->stock_qty > 0 ? 'active' : 'draft';

        return $this->productRepository->update($product, [
            'is_published' => $newPublished,
            'status'       => $newStatus,
        ]);
    }

    /**
     * Cek keselarasan harga produk dengan harga pasar
     * Digunakan oleh Market Price Alignment Widget
     */
    public function checkMarketPriceAlignment(Product $product): array
    {
        $farmerProfile = $product->farmer;

        // Ambil harga pasar terbaru untuk kategori & region petani
        $marketPrice = MarketPrice::where('category_id', $product->category_id)
            ->where('region', $farmerProfile->province)
            ->orderBy('recorded_date', 'desc')
            ->first();

        if (!$marketPrice) {
            return [
                'status'      => 'no_data',
                'message'     => 'Data harga pasar belum tersedia untuk kategori ini.',
                'market_avg'  => null,
                'your_price'  => $product->retail_price,
                'diff_percent'=> null,
            ];
        }

        $yourPrice  = $product->retail_price;
        $marketAvg  = $marketPrice->price_avg;
        $diffPct    = $marketAvg > 0
            ? round((($yourPrice - $marketAvg) / $marketAvg) * 100, 1)
            : 0;

        $status = match(true) {
            $diffPct < -10  => 'below_market',
            $diffPct <= 10  => 'aligned',
            $diffPct <= 25  => 'slightly_high',
            default         => 'above_market',
        };

        return [
            'status'       => $status,
            'market_low'   => $marketPrice->price_low,
            'market_high'  => $marketPrice->price_high,
            'market_avg'   => $marketAvg,
            'your_price'   => $yourPrice,
            'diff_percent' => $diffPct,
            'source'       => $marketPrice->source,
            'recorded_date'=> $marketPrice->recorded_date->toDateString(),
        ];
    }

    /**
     * Pastikan petani adalah pemilik produk
     */
    private function assertOwnership(User $farmer, Product $product): void
    {
        if ($product->farmer_id !== $farmer->farmerProfile?->id) {
            throw new AuthorizationException('Anda tidak memiliki izin untuk mengubah produk ini.');
        }
    }

    /**
     * Batasi jumlah produk aktif sesuai tier langganan
     * free: 20 produk, basic: 50 produk, pro: tidak terbatas
     */
    private function enforceProductLimit(FarmerProfile $farmerProfile): void
    {
        $limits = ['free' => 20, 'basic' => 50, 'pro' => PHP_INT_MAX];
        $limit  = $limits[$farmerProfile->subscription_tier] ?? 20;

        $count = Product::where('farmer_id', $farmerProfile->id)
                        ->whereNull('deleted_at')
                        ->count();

        if ($count >= $limit) {
            throw new \DomainException(
                "Batas produk untuk paket {$farmerProfile->subscription_tier} adalah {$limit} produk. " .
                "Upgrade paket untuk menambah lebih banyak produk."
            );
        }
    }

    /**
     * Generate slug unik dalam scope satu petani
     * Contoh: "tomat-cherry" → "tomat-cherry-2" jika sudah ada
     */
    private function generateUniqueProductSlug(string $farmerId, string $name): string
    {
        $base    = Str::slug($name);
        $slug    = $base;
        $counter = 2;

        while (Product::where('farmer_id', $farmerId)->where('slug', $slug)->exists()) {
            $slug = "{$base}-{$counter}";
            $counter++;
        }

        return $slug;
    }
}
