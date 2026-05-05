<?php

namespace App\Http\Controllers\Farmer;

use App\DTOs\CreateProductDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\CreateProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Models\ProductBoost;
use App\Repositories\Contracts\ProductRepositoryInterface;
use App\Services\ProductService;
use App\Traits\ApiResponse;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FarmerProductController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly ProductService             $productService,
        private readonly ProductRepositoryInterface $productRepository,
    ) {}

    /**
     * GET /api/v1/farmer/products
     * Daftar produk milik petani yang sedang login
     */
    public function index(Request $request): JsonResponse
    {
        $farmer  = $request->user()->farmerProfile;
        $filters = $request->only(['q', 'status', 'category_id', 'is_published', 'sort', 'per_page', 'page']);

        $paginator = $this->productRepository->findByFarmer($farmer->id, $filters);
        return $this->paginated($paginator);
    }

    /**
     * POST /api/v1/farmer/products
     * Buat produk baru
     */
    public function store(CreateProductRequest $request): JsonResponse
    {
        try {
            $dto     = CreateProductDTO::fromArray($request->validated());
            $product = $this->productService->createProduct($request->user(), $dto);
            return $this->created($product->load(['category']), 'Produk berhasil dibuat.');
        } catch (\DomainException $e) {
            return $this->error($e->getMessage(), 'PRODUCT_LIMIT_EXCEEDED', 403);
        } catch (\Exception $e) {
            logger()->error('Gagal membuat produk', ['error' => $e->getMessage()]);
            return $this->serverError();
        }
    }

    /**
     * GET /api/v1/farmer/products/{id}
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $product = $this->productRepository->findById($id);
        if (!$product || $product->farmer_id !== $request->user()->farmerProfile?->id) {
            return $this->notFound('Produk tidak ditemukan.');
        }
        return $this->success($product->load(['category']));
    }

    /**
     * PUT /api/v1/farmer/products/{id}
     */
    public function update(UpdateProductRequest $request, string $id): JsonResponse
    {
        try {
            $product = $this->productService->updateProduct(
                $request->user(),
                $id,
                $request->validated()
            );
            return $this->success($product, 'Produk berhasil diperbarui.');
        } catch (AuthorizationException $e) {
            return $this->forbidden($e->getMessage());
        } catch (\InvalidArgumentException $e) {
            return $this->error($e->getMessage(), 'VALIDATION_ERROR', 422);
        } catch (\DomainException $e) {
            return $this->notFound($e->getMessage());
        }
    }

    /**
     * DELETE /api/v1/farmer/products/{id}
     * Soft-delete (arsipkan) produk
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $product = $this->productRepository->findById($id);
        if (!$product || $product->farmer_id !== $request->user()->farmerProfile?->id) {
            return $this->notFound('Produk tidak ditemukan.');
        }
        $this->productRepository->delete($product);
        return $this->success(null, 'Produk berhasil diarsipkan.');
    }

    /**
     * POST /api/v1/farmer/products/{id}/publish
     * Toggle status publikasi produk
     */
    public function togglePublish(Request $request, string $id): JsonResponse
    {
        try {
            $product = $this->productService->togglePublish($request->user(), $id);
            $label   = $product->is_published ? 'dipublikasikan' : 'disembunyikan';
            return $this->success($product, "Produk berhasil {$label}.");
        } catch (AuthorizationException $e) {
            return $this->forbidden($e->getMessage());
        } catch (\DomainException $e) {
            return $this->notFound($e->getMessage());
        }
    }

    /**
     * GET /api/v1/farmer/products/{id}/price-check
     * Cek keselarasan harga dengan harga pasar
     */
    public function priceCheck(Request $request, string $id): JsonResponse
    {
        $product = $this->productRepository->findById($id);
        if (!$product || $product->farmer_id !== $request->user()->farmerProfile?->id) {
            return $this->notFound('Produk tidak ditemukan.');
        }

        $alignment = $this->productService->checkMarketPriceAlignment($product->load('farmer'));
        return $this->success($alignment);
    }

    /**
     * POST /api/v1/farmer/products/{id}/promote
     * Aktifkan "Seller Promotion" (featured) untuk produk dengan durasi tertentu.
     */
    public function promote(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'boost_type' => 'required|in:featured_homepage,top_search,category_banner',
            'days'       => 'required|integer|min:1|max:30',
        ]);

        $farmer = $request->user()->farmerProfile;
        if (!$farmer) {
            return $this->forbidden('Akun Anda tidak terhubung ke profil petani.');
        }

        if ($farmer->subscription_tier === 'free') {
            return $this->forbidden('Fitur promosi tersedia untuk paket Basic/Pro.');
        }

        $product = $this->productRepository->findById($id);
        if (!$product || $product->farmer_id !== $farmer->id) {
            return $this->notFound('Produk tidak ditemukan.');
        }

        $days = (int) $request->days;
        $boostType = (string) $request->boost_type;

        // Pricing sederhana (bisa diganti ke Midtrans nanti).
        $baseDaily = match ($boostType) {
            'featured_homepage' => 15000,
            'top_search'        => 10000,
            'category_banner'   => 8000,
            default             => 10000,
        };
        $pricePaid = $baseDaily * $days;

        $now = now();
        $expires = $now->copy()->addDays($days);

        $result = DB::transaction(function () use ($product, $farmer, $boostType, $now, $expires, $pricePaid) {
            // Nonaktifkan boost aktif sebelumnya untuk produk ini (jika ada)
            ProductBoost::where('product_id', $product->id)
                ->where('is_active', true)
                ->where('expires_at', '>', $now)
                ->update(['is_active' => false]);

            $boost = ProductBoost::create([
                'product_id'  => $product->id,
                'farmer_id'   => $farmer->id,
                'boost_type'  => $boostType,
                'starts_at'   => $now,
                'expires_at'  => $expires,
                'price_paid'  => $pricePaid,
                'is_active'   => true,
                'created_at'  => $now,
            ]);

            $product->update([
                'is_featured'    => true,
                'featured_until' => $expires,
            ]);

            return [$boost, $product->fresh()];
        });

        [$boost, $freshProduct] = $result;

        return $this->success([
            'boost' => $boost,
            'product' => $freshProduct,
        ], 'Promosi berhasil diaktifkan.');
    }
}
