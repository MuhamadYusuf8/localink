<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('order_number', 50)->unique();
            $table->uuid('buyer_id');
            $table->uuid('farmer_id');
            $table->jsonb('shipping_address');   // Snapshot alamat saat order
            $table->enum('status', [
                'pending_payment',
                'payment_confirmed',
                'processing',
                'ready_to_ship',
                'shipped',
                'delivered',
                'completed',
                'cancelled',
                'refund_requested',
                'refunded',
            ])->default('pending_payment');
            $table->integer('subtotal');
            $table->integer('shipping_fee')->default(0);
            $table->integer('platform_commission')->default(0);
            $table->integer('total_amount');
            $table->integer('farmer_earnings');
            $table->string('payment_method', 50)->nullable();
            $table->string('payment_gateway_id', 255)->nullable();
            $table->text('payment_proof')->nullable();
            $table->text('notes')->nullable();
            $table->text('cancelled_reason')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('shipped_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('buyer_id')
                  ->references('id')
                  ->on('users')
                  ->onDelete('restrict');

            $table->foreign('farmer_id')
                  ->references('id')
                  ->on('farmer_profiles')
                  ->onDelete('restrict');
        });

        DB::statement('CREATE INDEX orders_buyer_idx ON orders(buyer_id)');
        DB::statement('CREATE INDEX orders_farmer_idx ON orders(farmer_id)');
        DB::statement('CREATE INDEX orders_status_idx ON orders(status)');
        DB::statement('CREATE INDEX orders_created_at_idx ON orders(created_at DESC)');
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
