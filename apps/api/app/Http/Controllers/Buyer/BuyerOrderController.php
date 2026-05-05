<?php

namespace App\Http\Controllers\Buyer;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BuyerOrderController extends Controller
{
    use ApiResponse;

    /**
     * GET /api/v1/buyer/orders
     */
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $query = Order::with(['items', 'farmer:id,slug,store_name'])
            ->where('buyer_id', $userId);

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $paginator = $query->orderBy('created_at', 'desc')
                           ->paginate((int) $request->query('per_page', 10));

        return $this->paginated($paginator);
    }

    /**
     * GET /api/v1/buyer/orders/{id}
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $order = Order::with(['items', 'farmer:id,slug,store_name'])
            ->where('buyer_id', $request->user()->id)
            ->find($id);

        if (!$order) {
            return $this->notFound('Pesanan tidak ditemukan.');
        }

        return $this->success($order);
    }

    /**
     * POST /api/v1/buyer/orders/{id}/cancel
     * Pembatalan pesanan oleh pembeli
     */
    public function cancel(Request $request, string $id): JsonResponse
    {
        $order = Order::where('buyer_id', $request->user()->id)->find($id);
        if (!$order) return $this->notFound('Pesanan tidak ditemukan.');

        if (!$order->canTransitionTo('cancelled')) {
            return $this->error('Pesanan ini sudah tidak bisa dibatalkan.', 'INVALID_TRANSITION', 400);
        }

        $order->update([
            'status' => 'cancelled',
            'notes'  => $order->notes . "\n[Dibatalkan oleh pembeli]",
        ]);

        return $this->success($order->fresh(), 'Pesanan berhasil dibatalkan.');
    }

    /**
     * POST /api/v1/buyer/orders/{id}/complete
     * Konfirmasi pesanan diterima oleh pembeli
     */
    public function complete(Request $request, string $id): JsonResponse
    {
        $order = Order::where('buyer_id', $request->user()->id)->find($id);
        if (!$order) return $this->notFound('Pesanan tidak ditemukan.');

        if (!$order->canTransitionTo('completed')) {
            return $this->error('Pesanan belum bisa diselesaikan. Pastikan statusnya sudah dikirim atau tiba.', 'INVALID_TRANSITION', 400);
        }

        $order->update([
            'status'       => 'completed',
            'completed_at' => now(),
        ]);

        // Rekam komisi ke ledger secara asinkron atau langsung di sini
        // CommissionLedger::create([...]) bisa dipanggil via event/listener
        
        return $this->success($order->fresh(), 'Terima kasih, pesanan telah selesai.');
    }
}
