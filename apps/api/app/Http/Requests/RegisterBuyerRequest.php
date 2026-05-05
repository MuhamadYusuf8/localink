<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RegisterBuyerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'         => ['required', 'string', 'min:2', 'max:255'],
            'email'        => ['required', 'string', 'email:rfc,dns', 'max:255', 'unique:users,email'],
            'password'     => ['required', 'string', 'min:8', 'confirmed'],
            'buyer_type'   => ['required', 'in:retail,wholesale'],
            'company_name' => ['nullable', 'string', 'max:255', 'required_if:buyer_type,wholesale'],
            'tax_id'       => ['nullable', 'string', 'max:50'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'              => 'Nama wajib diisi.',
            'email.required'             => 'Email wajib diisi.',
            'email.email'                => 'Format email tidak valid.',
            'email.unique'               => 'Email sudah terdaftar. Silakan login.',
            'password.required'          => 'Password wajib diisi.',
            'password.min'               => 'Password minimal 8 karakter.',
            'password.confirmed'         => 'Konfirmasi password tidak cocok.',
            'buyer_type.required'        => 'Tipe pembeli wajib dipilih.',
            'buyer_type.in'              => 'Tipe pembeli harus retail atau wholesale.',
            'company_name.required_if'   => 'Nama perusahaan wajib diisi untuk pembeli grosir.',
        ];
    }
}
