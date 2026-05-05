<?php

namespace App\Http\Controllers\Farmer;

use App\Http\Controllers\Controller;
use App\Services\DashboardStatsService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FarmerDashboardController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly DashboardStatsService $statsService
    ) {}

    /**
     * GET /api/v1/farmer/dashboard/stats
     * Statistik ringkasan + data chart revenue
     */
    public function stats(Request $request): JsonResponse
    {
        $farmer  = $request->user()->farmerProfile;
        $days    = (int) $request->query('days', 30);
        $days    = in_array($days, [30, 60, 90]) ? $days : 30;

        $stats       = $this->statsService->getFarmerStats($farmer);
        $chartData   = $this->statsService->getRevenueChart($farmer, $days);
        $topProducts = $this->statsService->getTopProducts($farmer, 5);

        return $this->success([
            'stats'        => $stats,
            'chart'        => $chartData,
            'top_products' => $topProducts,
            'period_days'  => $days,
        ]);
    }
}
