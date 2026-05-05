<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Jalankan migrasi — tabel farmer_profiles
     */
    public function up(): void
    {
        Schema::create('farmer_profiles', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('user_id')->unique();
            $table->string('store_name');
            $table->string('slug')->unique();
            $table->text('bio')->nullable();
            $table->text('banner_url')->nullable();
            $table->string('location_label', 255)->nullable();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->string('province', 100)->nullable();
            $table->string('city', 100)->nullable();
            $table->string('district', 100)->nullable();
            $table->boolean('is_premium')->default(false);
            $table->timestamp('premium_expires_at')->nullable();
            $table->integer('total_sales')->default(0);
            $table->decimal('average_rating', 3, 2)->default(0.00);
            $table->integer('rating_count')->default(0);
            $table->enum('subscription_tier', ['free', 'basic', 'pro'])->default('free');
            $table->timestamps();

            $table->foreign('user_id')
                  ->references('id')
                  ->on('users')
                  ->onDelete('cascade');
        });

        DB::statement('CREATE INDEX farmer_profiles_location_idx ON farmer_profiles(latitude, longitude)');
        DB::statement('CREATE INDEX farmer_profiles_slug_idx ON farmer_profiles(slug)');
        DB::statement('CREATE INDEX farmer_profiles_city_idx ON farmer_profiles(city)');
    }

    public function down(): void
    {
        Schema::dropIfExists('farmer_profiles');
    }
};
