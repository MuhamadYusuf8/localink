<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_items', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('order_id');
            $table->uuid('product_id');
            $table->jsonb('product_snapshot');   // {name, unit, image, farmer_name, farmer_slug}
            $table->enum('pricing_type', ['retail', 'wholesale']);
            $table->integer('unit_price');
            $table->integer('quantity');
            $table->integer('total_price');      // unit_price * quantity
            $table->timestamps();

            $table->foreign('order_id')
                  ->references('id')
                  ->on('orders')
                  ->onDelete('cascade');

            $table->foreign('product_id')
                  ->references('id')
                  ->on('products')
                  ->onDelete('restrict');
        });

        DB::statement('CREATE INDEX order_items_order_idx ON order_items(order_id)');
        DB::statement('CREATE INDEX order_items_product_idx ON order_items(product_id)');
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
