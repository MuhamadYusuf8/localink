<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('market_prices', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('category_id');
            $table->string('product_name');
            $table->string('region', 100);
            $table->integer('price_low');
            $table->integer('price_high');
            $table->integer('price_avg');
            $table->string('source', 255)->nullable();
            $table->date('recorded_date');
            $table->timestamps();

            $table->foreign('category_id')
                  ->references('id')
                  ->on('product_categories')
                  ->onDelete('cascade');
        });

        DB::statement('CREATE INDEX market_prices_lookup_idx ON market_prices(category_id, region, recorded_date DESC)');
    }

    public function down(): void
    {
        Schema::dropIfExists('market_prices');
    }
};
