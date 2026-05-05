import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import Cookies from 'js-cookie'
import type { ApiErrorResponse, ApiSuccessResponse } from '@/types'

// ─── Konstanta ────────────────────────────────────────────
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? 'http://localhost:8000'
const TOKEN_COOKIE_KEY = 'es_auth_token'
const TOKEN_EXPIRY_DAYS = 1
const normalizedApiUrl = API_URL.replace(/\/+$/, '')
const baseApiUrl = /\/api\/v1$/i.test(normalizedApiUrl)
  ? normalizedApiUrl
  : `${normalizedApiUrl}/api/v1`

// ─── Axios Instance ───────────────────────────────────────
const apiClient: AxiosInstance = axios.create({
  baseURL: baseApiUrl,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  timeout: 30_000,
  withCredentials: true,
})

// ─── Request Interceptor: Tambahkan Bearer Token ──────────
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = Cookies.get(TOKEN_COOKIE_KEY)
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ─── Response Interceptor: Handle Error Global ────────────
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const status = error.response?.status

    // 401 — Tidak terautentikasi, hapus token dan redirect ke login
    if (status === 401) {
      Cookies.remove(TOKEN_COOKIE_KEY)
      if (typeof window !== 'undefined') {
        window.location.href = '/login?session=expired'
      }
      return Promise.reject(error)
    }

    // 403 — Akses ditolak (role salah)
    if (status === 403) {
      const apiError: ApiErrorResponse = {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Anda tidak memiliki akses ke halaman ini',
        },
      }
      return Promise.reject(apiError)
    }

    // 422 — Validasi gagal — kembalikan detail error
    if (status === 422) {
      const data = error.response?.data
      return Promise.reject(data as ApiErrorResponse)
    }

    // 429 — Rate limit
    if (status === 429) {
      const apiError: ApiErrorResponse = {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Terlalu banyak permintaan. Coba lagi beberapa saat.',
        },
      }
      return Promise.reject(apiError)
    }

    // 500+ — Server error
    if (status !== undefined && status >= 500) {
      const apiError: ApiErrorResponse = {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Terjadi kesalahan pada server. Coba lagi nanti.',
        },
      }
      return Promise.reject(apiError)
    }

    // Timeout atau network error
    if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
      const apiError: ApiErrorResponse = {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Koneksi bermasalah. Periksa koneksi internet Anda.',
        },
      }
      return Promise.reject(apiError)
    }

    return Promise.reject(error.response?.data ?? error)
  }
)

// ─── Helper: Set Token ────────────────────────────────────
export function setAuthToken(token: string, rememberMe = false): void {
  Cookies.set(TOKEN_COOKIE_KEY, token, {
    expires: rememberMe ? 30 : TOKEN_EXPIRY_DAYS,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  })
}

// ─── Helper: Clear Token ──────────────────────────────────
export function clearAuthToken(): void {
  Cookies.remove(TOKEN_COOKIE_KEY)
}

// ─── Helper: Get Token ────────────────────────────────────
export function getAuthToken(): string | undefined {
  return Cookies.get(TOKEN_COOKIE_KEY)
}

// ─── Typed API Call Wrapper ───────────────────────────────
export async function apiGet<T>(
  path: string,
  params?: Record<string, unknown>
): Promise<ApiSuccessResponse<T>> {
  const response = await apiClient.get<ApiSuccessResponse<T>>(path, { params })
  return response.data
}

export async function apiPost<T>(
  path: string,
  data?: unknown
): Promise<ApiSuccessResponse<T>> {
  const response = await apiClient.post<ApiSuccessResponse<T>>(path, data)
  return response.data
}

export async function apiPut<T>(
  path: string,
  data?: unknown
): Promise<ApiSuccessResponse<T>> {
  const response = await apiClient.put<ApiSuccessResponse<T>>(path, data)
  return response.data
}

export async function apiPatch<T>(
  path: string,
  data?: unknown
): Promise<ApiSuccessResponse<T>> {
  const response = await apiClient.patch<ApiSuccessResponse<T>>(path, data)
  return response.data
}

export async function apiDelete<T>(
  path: string
): Promise<ApiSuccessResponse<T>> {
  const response = await apiClient.delete<ApiSuccessResponse<T>>(path)
  return response.data
}

export async function apiUpload<T>(
  path: string,
  formData: FormData
): Promise<ApiSuccessResponse<T>> {
  const response = await apiClient.post<ApiSuccessResponse<T>>(path, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export default apiClient
