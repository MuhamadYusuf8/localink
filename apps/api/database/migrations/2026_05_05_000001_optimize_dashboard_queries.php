<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Menambahkan index untuk optimasi dashboard yang sangat lambat.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Index untuk statistik pendapatan (completed_at)
            $table->index('completed_at');
            
            // Index komposit untuk perhitungan repeat buyer
            $table->index(['farmer_id', 'buyer_id', 'status']);
        });

        Schema::table('order_items', function (Blueprint $table) {
            // Index untuk mempermudah perhitungan total_revenue per produk
            $table->index(['order_id', 'product_id', 'total_price']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['completed_at']);
            $table->dropIndex(['farmer_id', 'buyer_id', 'status']);
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->dropIndex(['order_id', 'product_id', 'total_price']);
        });
    }
};
