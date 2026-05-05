<?php

namespace App\DTOs;

readonly class ResetPasswordDTO
{
    public function __construct(
        public string $token,
        public string $email,
        public string $password,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            token:    $data['token'],
            email:    $data['email'],
            password: $data['password'],
        );
    }
}
