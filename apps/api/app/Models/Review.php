<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Review extends Model
{
    use HasUuids;

    protected $fillable = [
        'order_id', 'order_item_id', 'reviewer_id', 'farmer_id', 'product_id',
        'rating', 'title', 'body', 'images', 'farmer_reply', 'farmer_replied_at',
        'is_verified_purchase', 'is_published',
    ];

    protected $casts = [
        'images'              => 'array',
        'rating'              => 'integer',
        'is_verified_purchase'=> 'boolean',
        'is_published'        => 'boolean',
        'farmer_replied_at'   => 'datetime',
    ];

    public function reviewer(): BelongsTo { return $this->belongsTo(User::class, 'reviewer_id'); }
    public function farmer(): BelongsTo   { return $this->belongsTo(FarmerProfile::class, 'farmer_id'); }
    public function product(): BelongsTo  { return $this->belongsTo(Product::class); }
    public function order(): BelongsTo    { return $this->belongsTo(Order::class); }
    public function orderItem(): BelongsTo { return $this->belongsTo(OrderItem::class); }
}
