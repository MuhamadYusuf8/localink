<?php

namespace App\Http\Controllers\Auth;

use App\DTOs\RegisterFarmerDTO;
use App\DTOs\RegisterBuyerDTO;
use App\DTOs\ResetPasswordDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\RegisterFarmerRequest;
use App\Http\Requests\RegisterBuyerRequest;
use App\Http\Requests\LoginRequest;
use App\Services\AuthService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    use ApiResponse;

    public function __construct(private readonly AuthService $authService)
    {}

    /**
     * POST /api/v1/auth/register/farmer
     * Daftarkan akun petani baru
     */
    public function registerFarmer(RegisterFarmerRequest $request): JsonResponse
    {
        try {
            $dto    = RegisterFarmerDTO::fromArray($request->validated());
            $result = $this->authService->registerFarmer($dto);
            return $this->created($result, 'Akun petani berhasil dibuat. Silakan verifikasi email Anda.');
        } catch (\Exception $e) {
            logger()->error('Register farmer gagal', ['error' => $e->getMessage()]);
            return $this->serverError('Pendaftaran gagal. Coba lagi nanti.');
        }
    }

    /**
     * POST /api/v1/auth/register/buyer
     * Daftarkan akun pembeli baru
     */
    public function registerBuyer(RegisterBuyerRequest $request): JsonResponse
    {
        try {
            $dto    = RegisterBuyerDTO::fromArray($request->validated());
            $result = $this->authService->registerBuyer($dto);
            return $this->created($result, 'Akun pembeli berhasil dibuat.');
        } catch (\Exception $e) {
            logger()->error('Register buyer gagal', ['error' => $e->getMessage()]);
            return $this->serverError('Pendaftaran gagal. Coba lagi nanti.');
        }
    }

    /**
     * POST /api/v1/auth/login
     */
    public function login(LoginRequest $request): JsonResponse
    {
        try {
            $result = $this->authService->login(
                $request->email,
                $request->password
            );
            return $this->success($result, 'Login berhasil.');
        } catch (ValidationException $e) {
            return $this->validationError($e->errors(), 'Email atau password salah.');
        } catch (\Exception $e) {
            return $this->serverError();
        }
    }

    /**
     * POST /api/v1/auth/logout
     * [Requires: auth:sanctum]
     */
    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request->user());
        return $this->success(null, 'Logout berhasil.');
    }

    /**
     * GET /api/v1/auth/me
     * [Requires: auth:sanctum]
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        // Load relasi sesuai role
        $relations = match ($user->role) {
            'farmer' => ['farmerProfile'],
            'buyer'  => ['buyerProfile'],
            default  => [],
        };

        return $this->success($user->load($relations));
    }

    /**
     * POST /api/v1/auth/email/verify/{id}/{hash}
     */
    public function verifyEmail(Request $request, string $id, string $hash): JsonResponse
    {
        $success = $this->authService->verifyEmail($id, $hash);

        if (!$success) {
            return $this->error('Link verifikasi tidak valid atau sudah kedaluarsa.', 'INVALID_VERIFICATION_LINK', 400);
        }

        return $this->success(null, 'Email berhasil diverifikasi.');
    }

    /**
     * POST /api/v1/auth/email/resend
     * [Requires: auth:sanctum]
     */
    public function resendVerification(Request $request): JsonResponse
    {
        $this->authService->sendEmailVerification($request->user());
        return $this->success(null, 'Email verifikasi telah dikirim ulang.');
    }

    /**
     * POST /api/v1/auth/password/forgot
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => ['required', 'email']]);
        $this->authService->sendPasswordReset($request->email);
        // Selalu kembalikan sukses (mencegah email enumeration)
        return $this->success(null, 'Jika email terdaftar, instruksi reset akan dikirimkan.');
    }

    /**
     * POST /api/v1/auth/password/reset
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'token'                 => ['required', 'string'],
            'email'                 => ['required', 'email'],
            'password'              => ['required', 'string', 'min:8', 'confirmed'],
        ], [
            'token.required'    => 'Token reset tidak valid.',
            'email.required'    => 'Email wajib diisi.',
            'password.min'      => 'Password baru minimal 8 karakter.',
            'password.confirmed'=> 'Konfirmasi password tidak cocok.',
        ]);

        $dto     = ResetPasswordDTO::fromArray($request->all());
        $success = $this->authService->resetPassword($dto);

        if (!$success) {
            return $this->error('Token reset tidak valid atau sudah kedaluarsa.', 'INVALID_RESET_TOKEN', 400);
        }

        return $this->success(null, 'Password berhasil diperbarui. Silakan login dengan password baru Anda.');
    }
}
