<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\User;
use App\Models\Product;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class AdminDashboardController extends Controller
{
    use ApiResponse;

    /**
     * GET /api/v1/admin/dashboard/stats
     * Statistik global untuk platform admin
     */
    public function stats(): JsonResponse
    {
        $totalFarmers = User::where('role', 'farmer')->count();
        $totalBuyers = User::where('role', 'buyer')->count();
        $totalProducts = Product::where('is_published', true)->count();
        
        $gmv = Order::where('status', 'completed')->sum('total_amount');
        $platformRevenue = Order::where('status', 'completed')->sum('platform_commission');

        $recentOrders = Order::with(['buyer:id,name', 'farmer:id,store_name'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        return $this->success([
            'metrics' => [
                'total_farmers'    => $totalFarmers,
                'total_buyers'     => $totalBuyers,
                'total_products'   => $totalProducts,
                'gross_merchandise_value' => (int) $gmv,
                'platform_revenue' => (int) $platformRevenue,
            ],
            'recent_orders' => $recentOrders
        ]);
    }

    /**
     * GET /api/v1/admin/users
     * Manajemen user
     */
    public function users(): JsonResponse
    {
        $users = User::with(['farmerProfile', 'buyerProfile'])
            ->orderBy('created_at', 'desc')
            ->paginate(15);
            
        return $this->paginated($users);
    }
    
    /**
     * POST /api/v1/admin/users/{id}/suspend
     * Suspend user
     */
    public function suspendUser(string $id): JsonResponse
    {
        $user = User::find($id);
        if (!$user || $user->role === 'admin') return $this->notFound('User tidak valid.');
        
        // Soft delete simulates suspension in this PoC
        $user->delete();
        
        return $this->success(null, 'User berhasil disuspend.');
    }
}
