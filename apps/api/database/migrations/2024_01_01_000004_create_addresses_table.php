<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('addresses', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('user_id');
            $table->string('label', 100)->nullable();
            $table->string('recipient_name');
            $table->string('phone', 20);
            $table->text('full_address');
            $table->string('province', 100);
            $table->string('city', 100);
            $table->string('district', 100);
            $table->string('postal_code', 10);
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->boolean('is_default')->default(false);
            $table->timestamps();

            $table->foreign('user_id')
                  ->references('id')
                  ->on('users')
                  ->onDelete('cascade');
        });

        // Tambahkan FK default_address_id ke buyer_profiles setelah tabel addresses ada
        Schema::table('buyer_profiles', function (Blueprint $table) {
            $table->foreign('default_address_id')
                  ->references('id')
                  ->on('addresses')
                  ->onDelete('set null');
        });

        DB::statement('CREATE INDEX addresses_user_idx ON addresses(user_id)');
    }

    public function down(): void
    {
        Schema::table('buyer_profiles', function (Blueprint $table) {
            $table->dropForeign(['default_address_id']);
        });
        Schema::dropIfExists('addresses');
    }
};
