<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Address extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id', 'label', 'recipient_name', 'phone', 'full_address',
        'province', 'city', 'district', 'postal_code',
        'latitude', 'longitude', 'is_default',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'latitude'   => 'decimal:8',
        'longitude'  => 'decimal:8',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function toSnapshot(): array
    {
        return [
            'recipient_name' => $this->recipient_name,
            'phone'          => $this->phone,
            'full_address'   => $this->full_address,
            'province'       => $this->province,
            'city'           => $this->city,
            'district'       => $this->district,
            'postal_code'    => $this->postal_code,
        ];
    }
}
