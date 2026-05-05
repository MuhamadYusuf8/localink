<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Tabel conversations — dikelola oleh Supabase Realtime
        Schema::create('conversations', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('buyer_id');
            $table->uuid('farmer_id');
            $table->uuid('product_id')->nullable();
            $table->uuid('order_id')->nullable();
            $table->text('last_message')->nullable();
            $table->timestamp('last_message_at')->nullable();
            $table->integer('buyer_unread_count')->default(0);
            $table->integer('farmer_unread_count')->default(0);
            $table->timestamps();

            $table->foreign('buyer_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('farmer_id')->references('id')->on('farmer_profiles')->onDelete('cascade');
            $table->foreign('product_id')->references('id')->on('products')->onDelete('set null');
            $table->foreign('order_id')->references('id')->on('orders')->onDelete('set null');

            $table->unique(['buyer_id', 'farmer_id', 'product_id'], 'conversations_buyer_farmer_unique');
        });

        DB::statement('CREATE INDEX conversations_buyer_idx ON conversations(buyer_id)');
        DB::statement('CREATE INDEX conversations_farmer_idx ON conversations(farmer_id)');

        // Tabel messages — dengan RLS Supabase
        Schema::create('messages', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('conversation_id');
            $table->uuid('sender_id')->nullable();
            $table->text('content');
            $table->enum('message_type', ['text', 'image', 'offer', 'system'])->default('text');
            $table->jsonb('metadata')->nullable();  // {price, quantity, unit} untuk type=offer
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('conversation_id')->references('id')->on('conversations')->onDelete('cascade');
            $table->foreign('sender_id')->references('id')->on('users')->onDelete('set null');
        });

        DB::statement('CREATE INDEX messages_conversation_idx ON messages(conversation_id, created_at ASC)');
    }

    public function down(): void
    {
        Schema::dropIfExists('messages');
        Schema::dropIfExists('conversations');
    }
};
