<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FarmerProfile extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'store_name',
        'slug',
        'bio',
        'banner_url',
        'location_label',
        'latitude',
        'longitude',
        'province',
        'city',
        'district',
        'is_premium',
        'premium_expires_at',
        'total_sales',
        'average_rating',
        'rating_count',
        'subscription_tier',
    ];

    protected $casts = [
        'latitude'           => 'decimal:8',
        'longitude'          => 'decimal:8',
        'average_rating'     => 'decimal:2',
        'is_premium'         => 'boolean',
        'premium_expires_at' => 'datetime',
    ];

    // ─── Relasi ────────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class, 'farmer_id');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'farmer_id');
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class, 'farmer_id');
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class, 'farmer_id');
    }

    public function activeSubscription(): ?Subscription
    {
        return $this->subscriptions()
            ->where('status', 'active')
            ->where('expires_at', '>', now())
            ->latest('starts_at')
            ->first();
    }

    // ─── Accessor: Tarif Komisi Berdasarkan Tier ──────────
    public function getCommissionRateAttribute(): float
    {
        return match ($this->subscription_tier) {
            'pro'   => (float) config('commission.rate_pro',   0.03),
            'basic' => (float) config('commission.rate_basic', 0.05),
            default => (float) config('commission.rate_free',  0.07),
        };
    }
}
