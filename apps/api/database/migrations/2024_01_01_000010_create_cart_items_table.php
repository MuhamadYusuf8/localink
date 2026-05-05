<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cart_items', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('user_id');
            $table->uuid('product_id');
            $table->integer('quantity');
            $table->enum('pricing_type', ['retail', 'wholesale'])->default('retail');
            $table->timestamps();

            $table->foreign('user_id')
                  ->references('id')
                  ->on('users')
                  ->onDelete('cascade');

            $table->foreign('product_id')
                  ->references('id')
                  ->on('products')
                  ->onDelete('cascade');

            // Satu produk hanya muncul sekali per user di keranjang
            $table->unique(['user_id', 'product_id'], 'cart_items_user_product_unique');
        });

        DB::statement('CREATE INDEX cart_items_user_idx ON cart_items(user_id)');
    }

    public function down(): void
    {
        Schema::dropIfExists('cart_items');
    }
};
