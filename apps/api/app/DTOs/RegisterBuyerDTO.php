<?php

namespace App\DTOs;

/**
 * DTO untuk registrasi pembeli baru
 */
readonly class RegisterBuyerDTO
{
    public function __construct(
        public string  $name,
        public string  $email,
        public string  $password,
        public string  $buyerType,
        public ?string $companyName,
        public ?string $taxId,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            name:        $data['name'],
            email:       $data['email'],
            password:    $data['password'],
            buyerType:   $data['buyer_type'],
            companyName: $data['company_name'] ?? null,
            taxId:       $data['tax_id'] ?? null,
        );
    }
}
