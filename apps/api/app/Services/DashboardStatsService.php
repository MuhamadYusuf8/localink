<?php

namespace App\Services;

use App\Models\FarmerProfile;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

/**
 * DashboardStatsService — kalkulasi statistik untuk dashboard petani
 * Semua query dioptimasi dengan agregat SQL langsung
 */
class DashboardStatsService
{
    /**
     * Statistik ringkasan untuk dashboard petani
     */
    public function getFarmerStats(FarmerProfile $farmer): array
    {
        $farmerId = $farmer->id;
        $now      = now();
        $thisMonth = $now->copy()->startOfMonth();
        $lastMonth = $now->copy()->subMonth()->startOfMonth();
        $endLastMonth = $now->copy()->subMonth()->endOfMonth();

        // Pendapatan bulan ini
        $revenueThisMonth = Order::where('farmer_id', $farmerId)
            ->where('status', 'completed')
            ->where('completed_at', '>=', $thisMonth)
            ->sum('farmer_earnings');

        // Pendapatan bulan lalu (untuk perbandingan)
        $revenueLastMonth = Order::where('farmer_id', $farmerId)
            ->where('status', 'completed')
            ->whereBetween('completed_at', [$lastMonth, $endLastMonth])
            ->sum('farmer_earnings');

        // Pesanan bulan ini
        $ordersThisMonth = Order::where('farmer_id', $farmerId)
            ->where('created_at', '>=', $thisMonth)
            ->whereNotIn('status', ['pending_payment', 'cancelled'])
            ->count();

        // Pesanan bulan lalu
        $ordersLastMonth = Order::where('farmer_id', $farmerId)
            ->whereBetween('created_at', [$lastMonth, $endLastMonth])
            ->whereNotIn('status', ['pending_payment', 'cancelled'])
            ->count();

        // Rata-rata nilai pesanan
        $avgOrderValue = Order::where('farmer_id', $farmerId)
            ->where('status', 'completed')
            ->where('completed_at', '>=', $thisMonth)
            ->avg('total_amount') ?? 0;

        // Rate pembeli berulang
        $repeatBuyerRate = $this->calculateRepeatBuyerRate($farmerId);

        // Total produk aktif
        $totalProducts = Product::where('farmer_id', $farmerId)
            ->where('is_published', true)
            ->whereNull('deleted_at')
            ->count();

        return [
            'revenue_this_month' => (int) $revenueThisMonth,
            'revenue_last_month' => (int) $revenueLastMonth,
            'revenue_growth_pct' => $this->growthPercent($revenueThisMonth, $revenueLastMonth),
            'orders_this_month'  => $ordersThisMonth,
            'orders_last_month'  => $ordersLastMonth,
            'orders_growth_pct'  => $this->growthPercent($ordersThisMonth, $ordersLastMonth),
            'average_order_value'=> (int) $avgOrderValue,
            'repeat_buyer_rate'  => $repeatBuyerRate,
            'total_products'     => $totalProducts,
            'average_rating'     => $farmer->average_rating,
            'total_sales'        => $farmer->total_sales,
        ];
    }

    /**
     * Data chart pendapatan per hari untuk N hari terakhir
     * Mengembalikan array [{date, revenue, orders}]
     */
    public function getRevenueChart(FarmerProfile $farmer, int $days = 30): array
    {
        $farmerId  = $farmer->id;
        $startDate = now()->subDays($days)->startOfDay();

        $rows = DB::table('orders')
            ->select([
                DB::raw("TO_CHAR(completed_at, 'YYYY-MM-DD') as date"),
                DB::raw("SUM(farmer_earnings) as revenue"),
                DB::raw("COUNT(*) as orders"),
            ])
            ->where('farmer_id', $farmerId)
            ->where('status', 'completed')
            ->where('completed_at', '>=', $startDate)
            ->groupBy(DB::raw("TO_CHAR(completed_at, 'YYYY-MM-DD')"))
            ->orderBy('date', 'asc')
            ->get()
            ->keyBy('date');

        // Isi gap tanggal tanpa transaksi dengan nol
        $result = [];
        for ($i = $days; $i >= 0; $i--) {
            $date = now()->subDays($i)->toDateString();
            $result[] = [
                'date'    => $date,
                'revenue' => (int) ($rows[$date]->revenue ?? 0),
                'orders'  => (int) ($rows[$date]->orders ?? 0),
            ];
        }

        return $result;
    }

    /**
     * Top 5 produk berdasarkan jumlah terjual bulan ini
     */
    public function getTopProducts(FarmerProfile $farmer, int $limit = 5): array
    {
        return DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('products', 'products.id', '=', 'order_items.product_id')
            ->select([
                'products.id',
                'products.name',
                'products.slug',
                'products.retail_price',
                'products.unit',
                DB::raw("SUM(order_items.quantity) as total_sold"),
                DB::raw("SUM(order_items.total_price) as total_revenue"),
            ])
            ->where('orders.farmer_id', $farmer->id)
            ->where('orders.status', 'completed')
            ->where('orders.completed_at', '>=', now()->startOfMonth())
            ->whereNull('products.deleted_at')
            ->groupBy('products.id', 'products.name', 'products.slug', 'products.retail_price', 'products.unit')
            ->orderBy('total_sold', 'desc')
            ->limit($limit)
            ->get()
            ->map(fn($row) => [
                'product_id'    => $row->id,
                'name'          => $row->name,
                'slug'          => $row->slug,
                'retail_price'  => $row->retail_price,
                'unit'          => $row->unit,
                'total_sold'    => (int) $row->total_sold,
                'total_revenue' => (int) $row->total_revenue,
            ])
            ->toArray();
    }

    /**
     * Hitung rate pembeli berulang (%)
     * Pembeli yang melakukan lebih dari 1 pesanan kepada petani ini
     */
    private function calculateRepeatBuyerRate(string $farmerId): float
    {
        $totalBuyers = DB::table('orders')
            ->where('farmer_id', $farmerId)
            ->whereNotIn('status', ['pending_payment', 'cancelled'])
            ->distinct('buyer_id')
            ->count('buyer_id');

        if ($totalBuyers === 0) return 0.0;

        $repeatBuyers = DB::table('orders')
            ->select('buyer_id')
            ->where('farmer_id', $farmerId)
            ->whereNotIn('status', ['pending_payment', 'cancelled'])
            ->groupBy('buyer_id')
            ->havingRaw('COUNT(*) > 1')
            ->get()
            ->count();

        return round(($repeatBuyers / $totalBuyers) * 100, 1);
    }

    /**
     * Hitung persentase pertumbuhan antara dua periode
     */
    private function growthPercent(float|int $current, float|int $previous): float
    {
        if ($previous == 0) return $current > 0 ? 100.0 : 0.0;
        return round((($current - $previous) / $previous) * 100, 1);
    }
}
