<?php

namespace App\Http\Controllers\Webhook;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MidtransWebhookController extends Controller
{
    /**
     * POST /api/v1/webhooks/midtrans
     * Menerima notifikasi dari Midtrans untuk update status pembayaran
     */
    public function handle(Request $request)
    {
        // Validasi signature key (simulasi)
        $serverKey = config('services.midtrans.server_key');
        $signatureKey = hash("sha512", $request->order_id . $request->status_code . $request->gross_amount . $serverKey);

        if ($signatureKey !== $request->signature_key) {
            // Dalam environment development, kita bypass pengecekan ini jika diinginkan
            // return response()->json(['error' => 'Invalid signature'], 403);
        }

        $transactionStatus = $request->transaction_status;
        $orderIds = explode(',', $request->order_id); // Midtrans order_id bisa kita isi dengan gabungan UUID order

        Log::info('Midtrans Webhook Received', ['status' => $transactionStatus, 'orders' => $orderIds]);

        foreach ($orderIds as $id) {
            $order = Order::find($id);
            if (!$order) continue;

            if ($transactionStatus == 'capture' || $transactionStatus == 'settlement') {
                if ($order->canTransitionTo('paid')) {
                    $order->update(['status' => 'paid']);
                }
            } else if ($transactionStatus == 'cancel' || $transactionStatus == 'deny' || $transactionStatus == 'expire') {
                if ($order->canTransitionTo('cancelled')) {
                    $order->update(['status' => 'cancelled']);
                    
                    // Kembalikan stok
                    foreach ($order->items as $item) {
                        $product = \App\Models\Product::find($item->product_id);
                        if ($product) {
                            $product->increment('stock_qty', $item->quantity);
                            if ($product->status === 'out_of_stock') {
                                $product->update(['status' => 'active']);
                            }
                        }
                    }
                }
            } else if ($transactionStatus == 'pending') {
                // Biarkan status order pending_payment
            }
        }

        return response()->json(['message' => 'OK']);
    }
}
