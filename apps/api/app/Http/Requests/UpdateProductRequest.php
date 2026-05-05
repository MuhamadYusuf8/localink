<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name'              => ['sometimes', 'string', 'min:3', 'max:255'],
            'description'       => ['nullable', 'string', 'max:10000'],
            'category_id'       => ['nullable', 'uuid', 'exists:product_categories,id'],
            'unit'              => ['sometimes', 'string', 'max:50'],
            'retail_price'      => ['sometimes', 'integer', 'min:100'],
            'wholesale_price'   => ['nullable', 'integer', 'min:100'],
            'wholesale_min_qty' => ['nullable', 'integer', 'min:1'],
            'stock_qty'         => ['sometimes', 'integer', 'min:0'],
            'images'            => ['nullable', 'array', 'max:5'],
            'images.*.url'      => ['required_with:images', 'string', 'url'],
            'images.*.alt'      => ['nullable', 'string'],
            'images.*.is_primary' => ['nullable', 'boolean'],
            'is_published'      => ['sometimes', 'boolean'],
            'harvest_date'      => ['nullable', 'date'],
            'available_from'    => ['nullable', 'date'],
            'tags'              => ['nullable', 'array'],
            'tags.*'            => ['string', 'max:50'],
            'weight_per_unit'   => ['nullable', 'numeric', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'retail_price.min'   => 'Harga eceran minimal Rp 100.',
            'images.max'         => 'Maksimal 5 gambar.',
            'stock_qty.min'      => 'Stok tidak boleh negatif.',
        ];
    }
}
