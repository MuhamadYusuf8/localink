import type {
  AuthResponse,
  User,
  RegisterFarmerData,
  RegisterBuyerData,
} from '@/types'
import { apiGet, apiPost } from './client'

// ─── Auth API ─────────────────────────────────────────────

/**
 * Daftar sebagai petani
 */
export async function registerFarmer(
  data: RegisterFarmerData
): Promise<AuthResponse> {
  const res = await apiPost<AuthResponse>('/auth/register/farmer', data)
  return res.data
}

/**
 * Daftar sebagai pembeli
 */
export async function registerBuyer(
  data: RegisterBuyerData
): Promise<AuthResponse> {
  const res = await apiPost<AuthResponse>('/auth/register/buyer', data)
  return res.data
}

/**
 * Login dengan email dan password
 */
export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  const res = await apiPost<AuthResponse>('/auth/login', { email, password })
  return res.data
}

/**
 * Logout — hapus session di server
 */
export async function logout(): Promise<void> {
  await apiPost('/auth/logout')
}

/**
 * Ambil data user yang sedang login
 */
export async function getMe(): Promise<User> {
  const res = await apiGet<User>('/auth/me')
  return res.data
}

/**
 * Kirim ulang email verifikasi
 */
export async function resendEmailVerification(): Promise<void> {
  await apiPost('/auth/email/resend')
}

/**
 * Kirim email reset password
 */
export async function sendPasswordReset(email: string): Promise<void> {
  await apiPost('/auth/password/forgot', { email })
}

/**
 * Reset password dengan token
 */
export async function resetPassword(data: {
  token: string
  email: string
  password: string
  password_confirmation: string
}): Promise<void> {
  await apiPost('/auth/password/reset', data)
}
