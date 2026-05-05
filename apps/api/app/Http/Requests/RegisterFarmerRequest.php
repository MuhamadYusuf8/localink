<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validasi pendaftaran petani
 * Semua pesan error dalam Bahasa Indonesia
 */
class RegisterFarmerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'       => ['required', 'string', 'min:2', 'max:255'],
            'email'      => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'phone'      => ['required', 'string', 'min:10', 'max:15', 'unique:users,phone', 'regex:/^[0-9+\-\s]+$/'],
            'password'   => ['required', 'string', 'min:8', 'confirmed'],
            'store_name' => ['required', 'string', 'min:3', 'max:255'],
            'bio'        => ['nullable', 'string', 'max:500'],
            'province'   => ['required', 'string', 'max:100'],
            'city'       => ['required', 'string', 'max:100'],
            'district'   => ['required', 'string', 'max:100'],
            'latitude'   => ['nullable', 'numeric', 'between:-90,90'],
            'longitude'  => ['nullable', 'numeric', 'between:-180,180'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'       => 'Nama wajib diisi.',
            'name.min'            => 'Nama minimal 2 karakter.',
            'email.required'      => 'Email wajib diisi.',
            'email.email'         => 'Format email tidak valid.',
            'email.unique'        => 'Email sudah terdaftar. Gunakan email lain.',
            'phone.required'      => 'Nomor HP wajib diisi.',
            'phone.unique'        => 'Nomor HP sudah terdaftar.',
            'phone.min'           => 'Nomor HP minimal 10 digit.',
            'phone.regex'         => 'Format nomor HP tidak valid.',
            'password.required'   => 'Password wajib diisi.',
            'password.min'        => 'Password minimal 8 karakter.',
            'password.confirmed'  => 'Konfirmasi password tidak cocok.',
            'store_name.required' => 'Nama toko wajib diisi.',
            'store_name.min'      => 'Nama toko minimal 3 karakter.',
            'province.required'   => 'Provinsi wajib dipilih.',
            'city.required'       => 'Kota/Kabupaten wajib diisi.',
            'district.required'   => 'Kecamatan wajib diisi.',
            'latitude.between'    => 'Koordinat latitude tidak valid.',
            'longitude.between'   => 'Koordinat longitude tidak valid.',
        ];
    }
}
