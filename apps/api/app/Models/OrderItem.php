<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OrderItem extends Model
{
    use HasUuids;

    protected $fillable = [
        'order_id', 'product_id', 'product_snapshot',
        'pricing_type', 'unit_price', 'quantity', 'total_price',
    ];

    protected $casts = [
        'product_snapshot' => 'array',
        'unit_price'       => 'integer',
        'quantity'         => 'integer',
        'total_price'      => 'integer',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function review()
    {
        return $this->hasOne(Review::class);
    }
}
