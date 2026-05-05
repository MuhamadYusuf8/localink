<?php

namespace App\Repositories\Contracts;

use App\Models\Product;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * Interface kontrak ProductRepository
 * Semua operasi DB produk melewati layer ini
 */
interface ProductRepositoryInterface
{
    public function findByFarmer(string $farmerId, array $filters = []): LengthAwarePaginator;
    public function findBySlug(string $farmerSlug, string $productSlug): ?Product;
    public function findById(string $id): ?Product;
    public function create(array $data): Product;
    public function update(Product $product, array $data): Product;
    public function delete(Product $product): bool;
    public function updateStock(string $productId, int $delta): Product;
    public function incrementViewCount(string $productId): void;
}
