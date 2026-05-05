<?php

namespace App\Http\Controllers\Buyer;

use App\Http\Controllers\Controller;
use App\Models\Address;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CheckoutController extends Controller
{
    use ApiResponse;

    /**
     * POST /api/v1/buyer/checkout
     * Melakukan checkout untuk item-item di keranjang
     */
    public function checkout(Request $request): JsonResponse
    {
        $request->validate([
            'address_id'      => 'required|uuid|exists:addresses,id',
            'cart_item_ids'   => 'required|array|min:1',
            'cart_item_ids.*' => 'uuid|exists:cart_items,id',
            'payment_method'  => 'required|string',
            'notes'           => 'nullable|string|max:500',
        ]);

        $userId  = $request->user()->id;
        $address = Address::where('user_id', $userId)->findOrFail($request->address_id);

        $cartItems = CartItem::with('product.farmer')
            ->where('user_id', $userId)
            ->whereIn('id', $request->cart_item_ids)
            ->get();

        if ($cartItems->isEmpty()) {
            return $this->error('Tidak ada item untuk di-checkout.', 'EMPTY_CART', 400);
        }

        // Validasi ketersediaan stok
        foreach ($cartItems as $item) {
            $product = $item->product;
            if (!$product || !$product->is_published || $product->status !== 'active') {
                return $this->error("Produk {$product?->name} tidak lagi tersedia.", 'PRODUCT_UNAVAILABLE', 400);
            }
            if ($product->stock_qty < $item->quantity) {
                return $this->error("Stok untuk {$product->name} tidak mencukupi. Tersisa: {$product->stock_qty}", 'OUT_OF_STOCK', 400);
            }
            if ($item->pricing_type === 'wholesale' && $item->quantity < $product->wholesale_min_qty) {
                return $this->error("Kuantitas {$product->name} tidak memenuhi syarat grosir.", 'INVALID_QUANTITY', 400);
            }
        }

        // Karena pesanan per petani, kita kelompokkan cart items berdasarkan farmer_id
        $groupedByFarmer = $cartItems->groupBy(fn($item) => $item->product->farmer_id);

        try {
            $createdOrders = DB::transaction(function () use ($groupedByFarmer, $userId, $address, $request) {
                $orders = [];

                foreach ($groupedByFarmer as $farmerId => $items) {
                    $farmer = $items->first()->product->farmer;
                    
                    // Hitung total
                    $subtotal = 0;
                    foreach ($items as $item) {
                        $price = $item->product->getActivePriceAttribute($item->pricing_type);
                        $subtotal += $price * $item->quantity;
                    }

                    $shippingFee = 15000; // Mock: flat shipping fee per farmer
                    $platformCommissionRate = $farmer->commission_rate;
                    $platformCommission = (int) round($subtotal * $platformCommissionRate);
                    $totalAmount = $subtotal + $shippingFee;
                    $farmerEarnings = $subtotal - $platformCommission + $shippingFee;

                    // Buat Order
                    $order = Order::create([
                        'order_number'        => Order::generateOrderNumber(),
                        'buyer_id'            => $userId,
                        'farmer_id'           => $farmerId,
                        'shipping_address'    => $address->toSnapshot(),
                        'status'              => 'pending_payment',
                        'subtotal'            => $subtotal,
                        'shipping_fee'        => $shippingFee,
                        'platform_commission' => $platformCommission,
                        'total_amount'        => $totalAmount,
                        'farmer_earnings'     => $farmerEarnings,
                        'payment_method'      => $request->payment_method,
                        'notes'               => $request->notes,
                    ]);

                    // Buat Order Items dan Kurangi Stok Produk
                    foreach ($items as $item) {
                        $product = $item->product;
                        $unitPrice = $product->getActivePriceAttribute($item->pricing_type);

                        OrderItem::create([
                            'order_id'         => $order->id,
                            'product_id'       => $product->id,
                            'product_snapshot' => [
                                'name'        => $product->name,
                                'unit'        => $product->unit,
                                'primary_image'=> $product->primary_image['url'] ?? null,
                                'farmer_name' => $farmer->store_name,
                                'farmer_slug' => $farmer->slug,
                            ],
                            'pricing_type'     => $item->pricing_type,
                            'unit_price'       => $unitPrice,
                            'quantity'         => $item->quantity,
                            'total_price'      => $unitPrice * $item->quantity,
                        ]);

                        // Kurangi stok (Atomic menggunakan query)
                        Product::where('id', $product->id)->decrement('stock_qty', $item->quantity);
                        
                        // Cek jika stok 0 setelah decrement, set ke out_of_stock
                        $updatedProduct = Product::find($product->id);
                        if ($updatedProduct->stock_qty <= 0) {
                            $updatedProduct->update(['status' => 'out_of_stock']);
                        }
                    }

                    $orders[] = $order;
                }

                // Hapus item dari keranjang setelah berhasil dicheckout
                CartItem::whereIn('id', $request->cart_item_ids)->delete();

                return $orders;
            });

            // Return mock Midtrans Snap Token untuk order pertama (karena ini PoC)
            // Di implementasi nyata, kirim array order ini ke payment gateway aggregator
            return $this->success([
                'orders' => $createdOrders,
                'payment_url' => '/buyer/payment/mock?orders=' . collect($createdOrders)->pluck('id')->join(','),
            ], 'Pesanan berhasil dibuat. Silakan selesaikan pembayaran.');

        } catch (\Exception $e) {
            logger()->error('Checkout gagal', ['error' => $e->getMessage()]);
            return $this->serverError('Gagal memproses pesanan. Silakan coba lagi.');
        }
    }
}
