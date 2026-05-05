<?php

namespace App\Http\Controllers\Farmer;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FarmerOrderController extends Controller
{
    use ApiResponse;

    /**
     * GET /api/v1/farmer/orders
     */
    public function index(Request $request): JsonResponse
    {
        $farmerId = $request->user()->farmerProfile->id;

        $query = Order::with(['items', 'buyer.buyerProfile'])
            ->where('farmer_id', $farmerId);

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($from = $request->query('from')) {
            $query->whereDate('created_at', '>=', $from);
        }
        if ($to = $request->query('to')) {
            $query->whereDate('created_at', '<=', $to);
        }

        $paginator = $query->orderBy('created_at', 'desc')
                           ->paginate((int) $request->query('per_page', 15));

        return $this->paginated($paginator);
    }

    /**
     * GET /api/v1/farmer/orders/{id}
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $order = Order::with(['items', 'buyer.buyerProfile'])
            ->where('farmer_id', $request->user()->farmerProfile->id)
            ->find($id);

        if (!$order) return $this->notFound('Pesanan tidak ditemukan.');
        return $this->success($order);
    }

    /**
     * PATCH /api/v1/farmer/orders/{id}/status
     * Update status pesanan — hanya transisi yang valid
     */
    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'status'          => ['required', 'string'],
            'tracking_number' => ['required_if:status,shipped', 'nullable', 'string'],
        ], [
            'status.required'          => 'Status wajib diisi.',
            'tracking_number.required_if' => 'Nomor resi wajib diisi saat status "Dikirim".',
        ]);

        $order = Order::where('farmer_id', $request->user()->farmerProfile->id)->find($id);
        if (!$order) return $this->notFound('Pesanan tidak ditemukan.');

        $newStatus = $request->input('status');

        if (!$order->canTransitionTo($newStatus)) {
            return $this->error(
                "Transisi status dari '{$order->status}' ke '{$newStatus}' tidak diizinkan.",
                'INVALID_STATUS_TRANSITION',
                422
            );
        }

        $updateData = ['status' => $newStatus];

        match ($newStatus) {
            'shipped'   => $updateData['shipped_at']   = now(),
            'delivered' => $updateData['delivered_at'] = now(),
            'completed' => $updateData['completed_at'] = now(),
            default     => null,
        };

        if ($newStatus === 'shipped' && $request->tracking_number) {
            $updateData['notes'] = "Resi: " . $request->tracking_number;
        }

        $order->update($updateData);

        return $this->success($order->fresh(), 'Status pesanan berhasil diperbarui.');
    }
}
