<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'farmer_id',
        'category_id',
        'name',
        'slug',
        'description',
        'unit',
        'retail_price',
        'wholesale_price',
        'wholesale_min_qty',
        'stock_qty',
        'images',
        'is_published',
        'is_featured',
        'featured_until',
        'harvest_date',
        'available_from',
        'tags',
        'weight_per_unit',
        'status',
        'view_count',
        'sold_count',
        'average_rating',
        'rating_count',
    ];

    protected $casts = [
        'images'          => 'array',
        'tags'            => 'array',
        'is_published'    => 'boolean',
        'is_featured'     => 'boolean',
        'featured_until'  => 'datetime',
        'harvest_date'    => 'date',
        'available_from'  => 'date',
        'average_rating'  => 'decimal:2',
        'weight_per_unit' => 'decimal:3',
        'retail_price'    => 'integer',
        'wholesale_price' => 'integer',
        'deleted_at'      => 'datetime',
    ];

    // ─── Relasi ────────────────────────────────────────────

    public function farmer(): BelongsTo
    {
        return $this->belongsTo(FarmerProfile::class, 'farmer_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(ProductCategory::class, 'category_id');
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function cartItems(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }

    public function boosts(): HasMany
    {
        return $this->hasMany(ProductBoost::class);
    }

    // ─── Scopes ────────────────────────────────────────────

    public function scopePublished($query)
    {
        return $query->where('is_published', true)->where('status', 'active');
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true)
                     ->where('featured_until', '>', now());
    }

    // ─── Accessor: Harga Aktif (dengan tipe harga) ────────
    public function getActivePriceAttribute(string $pricingType = 'retail'): int
    {
        if ($pricingType === 'wholesale' && $this->wholesale_price !== null) {
            return $this->wholesale_price;
        }
        return $this->retail_price;
    }

    // ─── Accessor: Gambar Utama ───────────────────────────
    public function getPrimaryImageAttribute(): ?array
    {
        $images = $this->images ?? [];
        foreach ($images as $img) {
            if ($img['is_primary'] ?? false) return $img;
        }
        return $images[0] ?? null;
    }
}
