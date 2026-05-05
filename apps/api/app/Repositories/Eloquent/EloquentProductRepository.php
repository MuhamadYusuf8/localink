<?php

namespace App\Repositories\Eloquent;

use App\Models\Product;
use App\Repositories\Contracts\ProductRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

/**
 * Implementasi Eloquent dari ProductRepositoryInterface
 * Semua query DB produk terpusat di sini
 */
class EloquentProductRepository implements ProductRepositoryInterface
{
    /**
     * Ambil daftar produk milik petani dengan filter & paginasi
     */
    public function findByFarmer(string $farmerId, array $filters = []): LengthAwarePaginator
    {
        $query = Product::with(['category'])
            ->where('farmer_id', $farmerId)
            ->whereNull('deleted_at');

        // Filter berdasarkan status
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        // Filter berdasarkan kategori
        if (!empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        // Pencarian nama produk
        if (!empty($filters['q'])) {
            $query->where('name', 'ilike', '%' . $filters['q'] . '%');
        }

        // Filter produk yang sudah dipublikasikan
        if (isset($filters['is_published'])) {
            $query->where('is_published', (bool) $filters['is_published']);
        }

        // Pengurutan
        $sort = $filters['sort'] ?? 'newest';
        match ($sort) {
            'price_asc'  => $query->orderBy('retail_price', 'asc'),
            'price_desc' => $query->orderBy('retail_price', 'desc'),
            'rating'     => $query->orderBy('average_rating', 'desc'),
            'sold'       => $query->orderBy('sold_count', 'desc'),
            default      => $query->orderBy('created_at', 'desc'),
        };

        $perPage = min((int) ($filters['per_page'] ?? 15), 50);
        return $query->paginate($perPage);
    }

    /**
     * Cari produk berdasarkan slug petani dan slug produk
     */
    public function findBySlug(string $farmerSlug, string $productSlug): ?Product
    {
        return Product::with(['farmer.user', 'category', 'reviews' => fn($q) => $q->where('is_published', true)->latest()->limit(10)])
            ->whereHas('farmer', fn($q) => $q->where('slug', $farmerSlug))
            ->where('slug', $productSlug)
            ->where('is_published', true)
            ->first();
    }

    /**
     * Cari produk berdasarkan ID
     */
    public function findById(string $id): ?Product
    {
        return Product::with(['farmer', 'category'])->find($id);
    }

    /**
     * Buat produk baru
     */
    public function create(array $data): Product
    {
        return Product::create($data);
    }

    /**
     * Perbarui data produk
     */
    public function update(Product $product, array $data): Product
    {
        $product->update($data);
        return $product->fresh(['farmer', 'category']);
    }

    /**
     * Soft-delete / arsipkan produk
     */
    public function delete(Product $product): bool
    {
        $product->update(['status' => 'archived', 'is_published' => false]);
        return $product->delete();
    }

    /**
     * Perbarui stok produk secara atomik (mencegah race condition)
     * $delta positif = tambah stok, negatif = kurangi stok
     */
    public function updateStock(string $productId, int $delta): Product
    {
        return DB::transaction(function () use ($productId, $delta) {
            $product = Product::lockForUpdate()->findOrFail($productId);

            $newStock = $product->stock_qty + $delta;
            if ($newStock < 0) {
                throw new \DomainException("Stok tidak mencukupi untuk produk: {$product->name}");
            }

            $product->update([
                'stock_qty' => $newStock,
                'status'    => $newStock === 0 ? 'out_of_stock' : 'active',
            ]);

            return $product->fresh();
        });
    }

    /**
     * Tambah jumlah view produk (non-blocking, tidak perlu transaksi)
     */
    public function incrementViewCount(string $productId): void
    {
        Product::where('id', $productId)->increment('view_count');
    }
}
