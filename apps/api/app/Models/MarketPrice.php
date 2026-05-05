<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MarketPrice extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'category_id',
        'product_name',
        'region',
        'price_low',
        'price_high',
        'price_avg',
        'source',
        'recorded_date',
    ];

    protected $casts = [
        'recorded_date' => 'date',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(ProductCategory::class);
    }
}
