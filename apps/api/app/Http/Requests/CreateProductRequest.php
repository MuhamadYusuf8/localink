<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateProductRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name'              => ['required', 'string', 'min:3', 'max:255'],
            'description'       => ['nullable', 'string', 'max:10000'],
            'category_id'       => ['nullable', 'uuid', 'exists:product_categories,id'],
            'unit'              => ['required', 'string', 'max:50'],
            'retail_price'      => ['required', 'integer', 'min:100'],
            'wholesale_price'   => ['nullable', 'integer', 'min:100', 'lt:retail_price'],
            'wholesale_min_qty' => ['nullable', 'integer', 'min:1', 'required_with:wholesale_price'],
            'stock_qty'         => ['required', 'integer', 'min:0'],
            'images'            => ['nullable', 'array', 'max:5'],
            'images.*.url'      => ['required_with:images', 'string', 'url'],
            'images.*.alt'      => ['nullable', 'string'],
            'images.*.is_primary' => ['nullable', 'boolean'],
            'is_published'      => ['boolean'],
            'harvest_date'      => ['nullable', 'date', 'after_or_equal:today'],
            'available_from'    => ['nullable', 'date'],
            'tags'              => ['nullable', 'array'],
            'tags.*'            => ['string', 'max:50'],
            'weight_per_unit'   => ['nullable', 'numeric', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'             => 'Nama produk wajib diisi.',
            'name.min'                  => 'Nama produk minimal 3 karakter.',
            'unit.required'             => 'Satuan produk wajib dipilih.',
            'retail_price.required'     => 'Harga eceran wajib diisi.',
            'retail_price.min'          => 'Harga eceran minimal Rp 100.',
            'wholesale_price.lt'        => 'Harga grosir harus lebih rendah dari harga eceran.',
            'wholesale_min_qty.required_with' => 'Minimum kuantitas grosir wajib diisi.',
            'stock_qty.required'        => 'Jumlah stok wajib diisi.',
            'images.max'                => 'Maksimal 5 gambar.',
            'harvest_date.after_or_equal' => 'Tanggal panen tidak boleh di masa lalu.',
        ];
    }
}
