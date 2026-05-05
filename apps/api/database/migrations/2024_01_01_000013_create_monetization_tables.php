<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('farmer_id');
            $table->enum('plan', ['basic', 'pro']);
            $table->enum('status', ['active', 'expired', 'cancelled']);
            $table->integer('price_paid');
            $table->timestamp('starts_at');
            $table->timestamp('expires_at');
            $table->string('payment_id', 255)->nullable();
            $table->timestamps();

            $table->foreign('farmer_id')
                  ->references('id')
                  ->on('farmer_profiles')
                  ->onDelete('cascade');
        });

        DB::statement('CREATE INDEX subscriptions_farmer_idx ON subscriptions(farmer_id)');
        DB::statement('CREATE INDEX subscriptions_status_idx ON subscriptions(status, expires_at)');

        // Commission ledger
        Schema::create('commission_ledger', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('order_id');
            $table->uuid('farmer_id');
            $table->integer('order_total');
            $table->decimal('commission_rate', 5, 4);
            $table->integer('commission_amount');
            $table->integer('farmer_earnings');
            $table->enum('status', ['pending', 'released', 'withheld'])->default('pending');
            $table->timestamp('released_at')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('order_id')->references('id')->on('orders')->onDelete('restrict');
            $table->foreign('farmer_id')->references('id')->on('farmer_profiles')->onDelete('restrict');
        });

        DB::statement('CREATE INDEX commission_ledger_order_idx ON commission_ledger(order_id)');
        DB::statement('CREATE INDEX commission_ledger_farmer_idx ON commission_ledger(farmer_id)');
        DB::statement('CREATE INDEX commission_ledger_status_idx ON commission_ledger(status)');

        // Product boosts
        Schema::create('product_boosts', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('product_id');
            $table->uuid('farmer_id');
            $table->enum('boost_type', ['featured_homepage', 'top_search', 'category_banner']);
            $table->timestamp('starts_at');
            $table->timestamp('expires_at');
            $table->integer('price_paid');
            $table->boolean('is_active')->default(true);
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
            $table->foreign('farmer_id')->references('id')->on('farmer_profiles')->onDelete('cascade');
        });

        DB::statement('CREATE INDEX product_boosts_active_idx ON product_boosts(is_active, expires_at)');
        DB::statement('CREATE INDEX product_boosts_product_idx ON product_boosts(product_id)');
    }

    public function down(): void
    {
        Schema::dropIfExists('product_boosts');
        Schema::dropIfExists('commission_ledger');
        Schema::dropIfExists('subscriptions');
    }
};
