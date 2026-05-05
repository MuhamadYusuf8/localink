<?php

namespace App\Services;

use App\DTOs\RegisterFarmerDTO;
use App\DTOs\RegisterBuyerDTO;
use App\DTOs\ResetPasswordDTO;
use App\Models\User;
use App\Models\FarmerProfile;
use App\Models\BuyerProfile;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * AuthService — semua logika autentikasi dan identitas pengguna
 * Mengikuti Single Responsibility Principle
 */
class AuthService
{
    /**
     * Daftarkan petani baru beserta profil tokonya
     * Dibungkus dalam transaksi DB untuk atomisitas
     */
    public function registerFarmer(RegisterFarmerDTO $dto): array
    {
        return DB::transaction(function () use ($dto) {
            // Buat user utama
            $user = User::create([
                'name'     => $dto->name,
                'email'    => $dto->email,
                'phone'    => $dto->phone,
                'password' => Hash::make($dto->password),
                'role'     => 'farmer',
            ]);

            // Buat profil petani dengan slug unik
            $slug = $this->generateUniqueStoreSlug($dto->storeName);

            $locationLabel = implode(', ', array_filter([
                $dto->district,
                $dto->city,
                $dto->province,
            ]));

            FarmerProfile::create([
                'user_id'        => $user->id,
                'store_name'     => $dto->storeName,
                'slug'           => $slug,
                'bio'            => $dto->bio,
                'location_label' => $locationLabel,
                'latitude'       => $dto->latitude,
                'longitude'      => $dto->longitude,
                'province'       => $dto->province,
                'city'           => $dto->city,
                'district'       => $dto->district,
            ]);

            // Kirim notifikasi verifikasi email
            event(new Registered($user));

            // Buat token Sanctum
            $token = $user->createToken('api-token')->plainTextToken;

            return [
                'user'       => $user->fresh(['farmerProfile']),
                'token'      => $token,
                'token_type' => 'Bearer',
                'expires_in' => config('sanctum.expiration', 60) * 60,
            ];
        });
    }

    /**
     * Daftarkan pembeli baru
     */
    public function registerBuyer(RegisterBuyerDTO $dto): array
    {
        return DB::transaction(function () use ($dto) {
            $user = User::create([
                'name'     => $dto->name,
                'email'    => $dto->email,
                'password' => Hash::make($dto->password),
                'role'     => 'buyer',
            ]);

            BuyerProfile::create([
                'user_id'      => $user->id,
                'buyer_type'   => $dto->buyerType,
                'company_name' => $dto->companyName,
                'tax_id'       => $dto->taxId,
            ]);

            event(new Registered($user));

            $token = $user->createToken('api-token')->plainTextToken;

            return [
                'user'       => $user->fresh(['buyerProfile']),
                'token'      => $token,
                'token_type' => 'Bearer',
                'expires_in' => config('sanctum.expiration', 60) * 60,
            ];
        });
    }

    /**
     * Login dengan email dan password
     * Mencatat waktu login terakhir
     */
    public function login(string $email, string $password): array
    {
        $user = User::where('email', $email)->whereNull('deleted_at')->first();

        if (!$user || !Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email atau password salah.'],
            ]);
        }

        // Hapus token lama (single session)
        $user->tokens()->delete();

        // Catat waktu login terakhir hanya jika kolom tersedia
        if (Schema::hasColumn('users', 'last_login_at')) {
            $user->update(['last_login_at' => now()]);
        }

        $token = $user->createToken('api-token')->plainTextToken;

        // Eager load relasi sesuai role
        $relations = match ($user->role) {
            'farmer' => ['farmerProfile'],
            'buyer'  => ['buyerProfile'],
            default  => [],
        };

        return [
            'user'       => $user->fresh($relations),
            'token'      => $token,
            'token_type' => 'Bearer',
            'expires_in' => config('sanctum.expiration', 60) * 60,
        ];
    }

    /**
     * Logout — hapus semua token aktif
     */
    public function logout(User $user): void
    {
        $user->tokens()->delete();
    }

    /**
     * Verifikasi email berdasarkan signed URL
     */
    public function verifyEmail(string $id, string $hash): bool
    {
        $user = User::findOrFail($id);

        if (!hash_equals(sha1($user->email), $hash)) {
            return false;
        }

        if ($user->hasVerifiedEmail()) {
            return true; // Sudah terverifikasi sebelumnya
        }

        $user->markEmailAsVerified();
        $user->update(['is_verified' => true]);

        return true;
    }

    /**
     * Kirim ulang email verifikasi
     */
    public function sendEmailVerification(User $user): void
    {
        if (!$user->hasVerifiedEmail()) {
            $user->sendEmailVerificationNotification();
        }
    }

    /**
     * Kirim email reset password
     */
    public function sendPasswordReset(string $email): void
    {
        $status = Password::sendResetLink(['email' => $email]);

        if ($status !== Password::RESET_LINK_SENT) {
            // Tidak lempar error untuk mencegah email enumeration attack
            logger()->info("Reset password diminta untuk email: {$email}, status: {$status}");
        }
    }

    /**
     * Reset password dengan token
     */
    public function resetPassword(ResetPasswordDTO $dto): bool
    {
        $status = Password::reset(
            [
                'email'                 => $dto->email,
                'password'              => $dto->password,
                'password_confirmation' => $dto->password,
                'token'                 => $dto->token,
            ],
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                ])->save();

                // Hapus semua sesi aktif setelah reset
                $user->tokens()->delete();
            }
        );

        return $status === Password::PASSWORD_RESET;
    }

    /**
     * Generate slug unik untuk nama toko
     * Contoh: "Kebun Pak Budi" → "kebun-pak-budi" atau "kebun-pak-budi-2"
     */
    private function generateUniqueStoreSlug(string $storeName): string
    {
        $base = Str::slug($storeName);
        $slug = $base;
        $counter = 2;

        while (FarmerProfile::where('slug', $slug)->exists()) {
            $slug = "{$base}-{$counter}";
            $counter++;
        }

        return $slug;
    }
}
