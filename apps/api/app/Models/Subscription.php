<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Subscription extends Model
{
    use HasUuids;

    protected $fillable = [
        'farmer_id', 'plan', 'status', 'price_paid',
        'starts_at', 'expires_at', 'payment_id',
    ];

    protected $casts = [
        'price_paid' => 'integer',
        'starts_at'  => 'datetime',
        'expires_at' => 'datetime',
    ];

    public function farmer(): BelongsTo
    {
        return $this->belongsTo(FarmerProfile::class, 'farmer_id');
    }

    public function isActive(): bool
    {
        return $this->status === 'active' && $this->expires_at->isFuture();
    }
}
