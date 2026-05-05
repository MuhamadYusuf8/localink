<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('buyer_profiles', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('user_id')->unique();
            $table->enum('buyer_type', ['retail', 'wholesale'])->default('retail');
            $table->string('company_name', 255)->nullable();
            $table->string('tax_id', 50)->nullable();
            // default_address_id ditambah setelah tabel addresses dibuat
            $table->uuid('default_address_id')->nullable();
            $table->timestamps();

            $table->foreign('user_id')
                  ->references('id')
                  ->on('users')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('buyer_profiles');
    }
};
