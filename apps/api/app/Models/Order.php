<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Order extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'order_number',
        'buyer_id',
        'farmer_id',
        'shipping_address',
        'status',
        'subtotal',
        'shipping_fee',
        'platform_commission',
        'total_amount',
        'farmer_earnings',
        'payment_method',
        'payment_gateway_id',
        'payment_proof',
        'notes',
        'cancelled_reason',
        'paid_at',
        'shipped_at',
        'delivered_at',
        'completed_at',
    ];

    protected $casts = [
        'shipping_address'   => 'array',
        'paid_at'            => 'datetime',
        'shipped_at'         => 'datetime',
        'delivered_at'       => 'datetime',
        'completed_at'       => 'datetime',
        'subtotal'           => 'integer',
        'shipping_fee'       => 'integer',
        'platform_commission'=> 'integer',
        'total_amount'       => 'integer',
        'farmer_earnings'    => 'integer',
        'deleted_at'         => 'datetime',
    ];

    // ─── Transisi Status yang Valid ───────────────────────
    public const VALID_TRANSITIONS = [
        'payment_confirmed' => ['processing'],
        'processing'        => ['ready_to_ship'],
        'ready_to_ship'     => ['shipped'],
        'shipped'           => ['delivered'],
        'delivered'         => ['completed'],
    ];

    public const CANCELLABLE_STATUSES = [
        'pending_payment',
        'payment_confirmed',
        'processing',
    ];

    // ─── Relasi ────────────────────────────────────────────

    public function buyer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    public function farmer(): BelongsTo
    {
        return $this->belongsTo(FarmerProfile::class, 'farmer_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function commissionLedger()
    {
        return $this->hasOne(CommissionLedger::class);
    }

    // ─── Helper ────────────────────────────────────────────

    public function canTransitionTo(string $newStatus): bool
    {
        $allowed = self::VALID_TRANSITIONS[$this->status] ?? [];
        return in_array($newStatus, $allowed);
    }

    public function isCancellable(): bool
    {
        return in_array($this->status, self::CANCELLABLE_STATUSES);
    }

    // ─── Generate Nomor Order Unik ────────────────────────
    public static function generateOrderNumber(): string
    {
        $year = now()->format('Y');
        $seq  = str_pad((string) random_int(1, 999999), 6, '0', STR_PAD_LEFT);
        return "ES-{$year}-{$seq}";
    }
}
