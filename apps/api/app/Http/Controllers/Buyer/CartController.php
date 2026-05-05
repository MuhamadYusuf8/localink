<?php

namespace App\Http\Controllers\Buyer;

use App\Http\Controllers\Controller;
use App\Models\CartItem;
use App\Models\Product;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CartController extends Controller
{
    use ApiResponse;

    /**
     * GET /api/v1/buyer/cart
     */
    public function index(Request $request): JsonResponse
    {
        $items = CartItem::with(['product.farmer', 'product.category'])
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get();

        // Validasi stok & harga saat keranjang di-load
        $items->each(function ($item) {
            $product = $item->product;
            $item->is_available = $product && $product->is_published && $product->status === 'active' && $product->stock_qty >= $item->quantity;
            $item->current_price = $product ? $product->getActivePriceAttribute($item->pricing_type) : 0;
            
            // Cek batasan grosir jika tipe pricing grosir
            if ($item->pricing_type === 'wholesale') {
                $item->meets_wholesale_min = $item->quantity >= $product->wholesale_min_qty;
            } else {
                $item->meets_wholesale_min = true;
            }
        });

        // Grouping by Farmer untuk tampilan checkout yang logis
        $grouped = $items->groupBy(function ($item) {
            return $item->product?->farmer?->store_name ?? 'Unknown';
        });

        return $this->success([
            'items'   => $items,
            'grouped' => $grouped,
            'summary' => $this->calculateSummary($items),
        ]);
    }

    /**
     * POST /api/v1/buyer/cart/items
     */
    public function addItem(Request $request): JsonResponse
    {
        $request->validate([
            'product_id'   => 'required|uuid|exists:products,id',
            'quantity'     => 'required|integer|min:1',
            'pricing_type' => 'required|in:retail,wholesale',
        ]);

        $product = Product::findOrFail($request->product_id);

        if (!$product->is_published || $product->stock_qty < $request->quantity) {
            return $this->error('Stok produk tidak mencukupi.', 'OUT_OF_STOCK', 400);
        }

        if ($request->pricing_type === 'wholesale' && $request->quantity < $product->wholesale_min_qty) {
            return $this->error("Minimal pembelian grosir adalah {$product->wholesale_min_qty} {$product->unit}.", 'INVALID_QUANTITY', 400);
        }

        $cartItem = CartItem::where('user_id', $request->user()->id)
            ->where('product_id', $request->product_id)
            ->first();

        if ($cartItem) {
            $cartItem->update([
                'quantity'     => $cartItem->quantity + $request->quantity,
                'pricing_type' => $request->pricing_type,
            ]);
        } else {
            $cartItem = CartItem::create([
                'user_id'      => $request->user()->id,
                'product_id'   => $request->product_id,
                'quantity'     => $request->quantity,
                'pricing_type' => $request->pricing_type,
            ]);
        }

        return $this->success($cartItem->fresh(['product']), 'Berhasil ditambahkan ke keranjang.');
    }

    /**
     * PATCH /api/v1/buyer/cart/items/{id}
     */
    public function updateItem(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'quantity' => 'required|integer|min:1',
        ]);

        $cartItem = CartItem::where('user_id', $request->user()->id)->find($id);
        if (!$cartItem) return $this->notFound('Item tidak ditemukan.');

        $product = $cartItem->product;
        if ($product->stock_qty < $request->quantity) {
            return $this->error('Stok produk tidak mencukupi.', 'OUT_OF_STOCK', 400);
        }

        $cartItem->update(['quantity' => $request->quantity]);

        return $this->success($cartItem->fresh(['product']));
    }

    /**
     * DELETE /api/v1/buyer/cart/items/{id}
     */
    public function removeItem(Request $request, string $id): JsonResponse
    {
        $cartItem = CartItem::where('user_id', $request->user()->id)->find($id);
        if ($cartItem) $cartItem->delete();
        
        return $this->success(null, 'Item dihapus dari keranjang.');
    }

    private function calculateSummary($items): array
    {
        $total = 0;
        foreach ($items as $item) {
            if ($item->is_available && $item->meets_wholesale_min) {
                $total += $item->current_price * $item->quantity;
            }
        }
        return [
            'total_items'  => $items->sum('quantity'),
            'subtotal'     => $total,
            'shipping_est' => 0, // Hitung nanti di checkout
            'grand_total'  => $total,
        ];
    }
}
