<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reviews', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('order_id');
            $table->uuid('order_item_id');
            $table->uuid('reviewer_id')->nullable();
            $table->uuid('farmer_id');
            $table->uuid('product_id')->nullable();
            $table->smallInteger('rating');
            $table->string('title', 255)->nullable();
            $table->text('body')->nullable();
            $table->jsonb('images')->default('[]');
            $table->text('farmer_reply')->nullable();
            $table->timestamp('farmer_replied_at')->nullable();
            $table->boolean('is_verified_purchase')->default(true);
            $table->boolean('is_published')->default(true);
            $table->timestamps();

            $table->foreign('order_id')->references('id')->on('orders')->onDelete('cascade');
            $table->foreign('order_item_id')->references('id')->on('order_items')->onDelete('cascade');
            $table->foreign('reviewer_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('farmer_id')->references('id')->on('farmer_profiles')->onDelete('cascade');
            $table->foreign('product_id')->references('id')->on('products')->onDelete('set null');

            $table->unique(['order_item_id', 'reviewer_id'], 'reviews_order_item_unique');
        });

        DB::statement('ALTER TABLE reviews ADD CONSTRAINT reviews_rating_check CHECK (rating BETWEEN 1 AND 5)');
        DB::statement('CREATE INDEX reviews_product_idx ON reviews(product_id)');
        DB::statement('CREATE INDEX reviews_farmer_idx ON reviews(farmer_id)');
    }

    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};
