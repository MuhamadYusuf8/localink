<?php

namespace App\Http\Controllers\Messaging;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MessageController extends Controller
{
    use ApiResponse;

    /**
     * GET /api/v1/conversations
     * Daftar percakapan user (bisa sebagai buyer atau farmer)
     */
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $conversations = Conversation::with(['farmer.user', 'buyer'])
            ->where('buyer_id', $userId)
            ->orWhereHas('farmer', fn($q) => $q->where('user_id', $userId))
            ->orderBy('last_message_at', 'desc')
            ->get()
            ->map(function ($conv) use ($userId) {
                // Tentukan siapa lawan bicaranya
                $isBuyer = $conv->buyer_id === $userId;
                $peer = $isBuyer 
                    ? ($conv->farmer->store_name ?? 'Petani') 
                    : ($conv->buyer->name ?? 'Pembeli');
                $peerAvatar = $isBuyer 
                    ? ($conv->farmer->user->avatar_url ?? null) 
                    : ($conv->buyer->avatar_url ?? null);

                return [
                    'id'              => $conv->id,
                    'peer_name'       => $peer,
                    'peer_avatar'     => $peerAvatar,
                    'last_message'    => $conv->last_message,
                    'last_message_at' => $conv->last_message_at,
                    'is_buyer'        => $isBuyer,
                ];
            });

        return $this->success($conversations);
    }

    /**
     * GET /api/v1/conversations/{id}/messages
     * History chat dalam satu percakapan
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $userId = $request->user()->id;

        $conversation = Conversation::where('id', $id)
            ->where(function ($q) use ($userId) {
                $q->where('buyer_id', $userId)
                  ->orWhereHas('farmer', fn($sq) => $sq->where('user_id', $userId));
            })->first();

        if (!$conversation) {
            return $this->notFound('Percakapan tidak ditemukan.');
        }

        $messages = Message::where('conversation_id', $id)
            ->orderBy('created_at', 'asc')
            ->get();

        // Tandai sudah dibaca
        Message::where('conversation_id', $id)
            ->where('sender_id', '!=', $userId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return $this->success($messages);
    }

    /**
     * POST /api/v1/conversations
     * Mulai percakapan baru atau ambil yang sudah ada
     */
    public function storeConversation(Request $request): JsonResponse
    {
        $request->validate([
            'farmer_id' => 'nullable|uuid',
            'buyer_id'  => 'nullable|uuid',
        ]);

        $currentUserId = $request->user()->id;
        $buyerId = null;
        $farmerUserId = null;

        if ($request->farmer_id) {
            // Current user is starting chat with a farmer
            $buyerId = $currentUserId;
            $profile = \App\Models\FarmerProfile::where('id', $request->farmer_id)
                ->orWhere('user_id', $request->farmer_id)
                ->first();

            if (!$profile) {
                return $this->error('Petani tidak ditemukan.', 'FARMER_NOT_FOUND', 404);
            }
            $farmerUserId = $profile->user_id;
        } elseif ($request->buyer_id) {
            // Current user is starting chat with a buyer
            $farmerUserId = $currentUserId;
            $buyerId = $request->buyer_id;
            
            $buyer = \App\Models\User::find($buyerId);
            if (!$buyer) {
                return $this->error('Pembeli tidak ditemukan.', 'BUYER_NOT_FOUND', 404);
            }
        } else {
            return $this->error('Harus menyertakan farmer_id atau buyer_id.', 'MISSING_PARTICIPANT', 400);
        }

        // Cegah chat dengan diri sendiri
        if ($buyerId === $farmerUserId) {
            return $this->error('Anda tidak dapat memulai chat dengan diri sendiri.', 'SELF_CHAT_FORBIDDEN', 400);
        }

        $conversation = Conversation::firstOrCreate(
            ['buyer_id' => $buyerId, 'farmer_id' => $farmerUserId],
            ['last_message_at' => now()]
        );

        return $this->success($conversation);
    }

    /**
     * POST /api/v1/conversations/{id}/messages
     * Kirim pesan baru
     */
    public function sendMessage(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'content'      => 'required|string|max:1000',
            'product_id'   => 'nullable|uuid|exists:products,id',
        ]);

        $userId = $request->user()->id;

        $conversation = Conversation::where('id', $id)
            ->where(function ($q) use ($userId) {
                $q->where('buyer_id', $userId)
                  ->orWhereHas('farmer', fn($sq) => $sq->where('user_id', $userId));
            })->first();

        if (!$conversation) {
            return $this->notFound('Percakapan tidak ditemukan.');
        }

        $message = DB::transaction(function () use ($request, $conversation, $userId) {
            $msg = Message::create([
                'conversation_id' => $conversation->id,
                'sender_id'       => $userId,
                'content'         => $request->content,
                'product_id'      => $request->product_id,
                'is_read'         => false,
            ]);

            $conversation->update([
                'last_message'    => $request->content,
                'last_message_at' => now(),
            ]);

            return $msg;
        });

        // Di sini kita bisa memicu broadcast event ke Supabase/Pusher
        // event(new MessageSent($message));

        return $this->success($message);
    }
}
