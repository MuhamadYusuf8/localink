<?php

namespace App\DTOs;

/**
 * DTO untuk registrasi petani baru
 */
readonly class RegisterFarmerDTO
{
    public function __construct(
        public string  $name,
        public string  $email,
        public string  $phone,
        public string  $password,
        public string  $storeName,
        public ?string $bio,
        public string  $province,
        public string  $city,
        public string  $district,
        public ?float  $latitude,
        public ?float  $longitude,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            name:      $data['name'],
            email:     $data['email'],
            phone:     $data['phone'],
            password:  $data['password'],
            storeName: $data['store_name'],
            bio:       $data['bio'] ?? null,
            province:  $data['province'],
            city:      $data['city'],
            district:  $data['district'],
            latitude:  isset($data['latitude'])  ? (float) $data['latitude']  : null,
            longitude: isset($data['longitude']) ? (float) $data['longitude'] : null,
        );
    }
}
