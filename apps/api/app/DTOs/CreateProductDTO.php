<?php

namespace App\DTOs;

/**
 * DTO untuk pembuatan produk baru
 */
readonly class CreateProductDTO
{
    public function __construct(
        public string  $name,
        public string  $description,
        public ?string $categoryId,
        public string  $unit,
        public int     $retailPrice,
        public ?int    $wholesalePrice,
        public ?int    $wholesaleMinQty,
        public int     $stockQty,
        public array   $images,
        public bool    $isPublished,
        public ?string $harvestDate,
        public ?string $availableFrom,
        public array   $tags,
        public ?float  $weightPerUnit,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            name:             $data['name'],
            description:      $data['description'] ?? '',
            categoryId:       $data['category_id'] ?? null,
            unit:             $data['unit'],
            retailPrice:      (int) $data['retail_price'],
            wholesalePrice:   isset($data['wholesale_price']) ? (int) $data['wholesale_price'] : null,
            wholesaleMinQty:  isset($data['wholesale_min_qty']) ? (int) $data['wholesale_min_qty'] : null,
            stockQty:         (int) ($data['stock_qty'] ?? 0),
            images:           $data['images'] ?? [],
            isPublished:      (bool) ($data['is_published'] ?? false),
            harvestDate:      $data['harvest_date'] ?? null,
            availableFrom:    $data['available_from'] ?? null,
            tags:             $data['tags'] ?? [],
            weightPerUnit:    isset($data['weight_per_unit']) ? (float) $data['weight_per_unit'] : null,
        );
    }
}
