<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_categories', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('parent_id')->nullable();
            $table->string('name', 100);
            $table->string('slug', 100)->unique();
            $table->text('icon_url')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::table('product_categories', function (Blueprint $table) {
            $table->foreign('parent_id')
                  ->references('id')
                  ->on('product_categories')
                  ->onDelete('set null');
        });

        DB::statement('CREATE INDEX product_categories_parent_idx ON product_categories(parent_id)');
        DB::statement('CREATE INDEX product_categories_slug_idx ON product_categories(slug)');
    }

    public function down(): void
    {
        Schema::dropIfExists('product_categories');
    }
};
