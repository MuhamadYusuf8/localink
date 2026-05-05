<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('farmer_id');
            $table->uuid('category_id')->nullable();
            $table->string('name');
            $table->string('slug');
            $table->text('description')->nullable();
            $table->string('unit', 50);
            $table->integer('retail_price');         // IDR integer
            $table->integer('wholesale_price')->nullable();
            $table->integer('wholesale_min_qty')->nullable();
            $table->integer('stock_qty')->default(0);
            $table->jsonb('images')->default('[]');  // [{url, alt, is_primary}]
            $table->boolean('is_published')->default(false);
            $table->boolean('is_featured')->default(false);
            $table->timestamp('featured_until')->nullable();
            $table->date('harvest_date')->nullable();
            $table->date('available_from')->nullable();
            $table->jsonb('tags')->default('[]');     // Using jsonb instead of text[]
            $table->decimal('weight_per_unit', 8, 3)->nullable();
            $table->enum('status', ['draft', 'active', 'out_of_stock', 'archived'])->default('draft');
            $table->integer('view_count')->default(0);
            $table->integer('sold_count')->default(0);
            $table->decimal('average_rating', 3, 2)->default(0.00);
            $table->integer('rating_count')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('farmer_id')
                  ->references('id')
                  ->on('farmer_profiles')
                  ->onDelete('cascade');

            $table->foreign('category_id')
                  ->references('id')
                  ->on('product_categories')
                  ->onDelete('set null');

            // Slug unik per petani
            $table->unique(['farmer_id', 'slug'], 'products_farmer_slug_unique');
        });

        // Indeks performa
        DB::statement('CREATE INDEX products_farmer_idx ON products(farmer_id)');
        DB::statement('CREATE INDEX products_category_idx ON products(category_id)');
        DB::statement('CREATE INDEX products_status_idx ON products(status)');
        DB::statement('CREATE INDEX products_retail_price_idx ON products(retail_price)');

        // GIN index for jsonb tags array
        DB::statement('CREATE INDEX products_tags_idx ON products USING GIN(tags)');

        // Full-text search index pada name + description
        DB::statement("
            CREATE INDEX products_fts_idx ON products
            USING GIN(to_tsvector('indonesian', coalesce(name,'') || ' ' || coalesce(description,'')))
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
