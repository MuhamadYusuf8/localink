import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import apiClient from '@/lib/api/client'

export interface CartItem {
  id: string
  product_id: string
  quantity: number
  pricing_type: 'retail' | 'wholesale'
  is_available: boolean
  current_price: number
  meets_wholesale_min: boolean
  product?: {
    name: string
    unit: string
    images: { url: string }[]
    farmer: { id: string; store_name: string }
  }
}

interface CartSummary {
  total_items: number
  subtotal: number
  shipping_est: number
  grand_total: number
}

interface CartState {
  items: CartItem[]
  grouped: Record<string, CartItem[]>
  summary: CartSummary
  isLoading: boolean
  isSyncing: boolean
  fetchCart: () => Promise<void>
  addItem: (productId: string, quantity: number, pricingType: 'retail' | 'wholesale') => Promise<void>
  updateItem: (id: string, quantity: number) => Promise<void>
  removeItem: (id: string) => Promise<void>
  clearCart: () => void
}

const defaultSummary: CartSummary = {
  total_items: 0,
  subtotal: 0,
  shipping_est: 0,
  grand_total: 0,
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      grouped: {},
      summary: defaultSummary,
      isLoading: false,
      isSyncing: false,

      fetchCart: async () => {
        set({ isLoading: true })
        try {
          const res = await apiClient.get('/buyer/cart')
          const { items, grouped, summary } = res.data.data
          set({ items, grouped, summary })
        } catch (error) {
          console.error('Failed to fetch cart', error)
        } finally {
          set({ isLoading: false })
        }
      },

      addItem: async (productId, quantity, pricingType) => {
        set({ isSyncing: true })
        try {
          await apiClient.post('/buyer/cart/items', {
            product_id: productId,
            quantity,
            pricing_type: pricingType,
          })
          await get().fetchCart()
        } catch (error: any) {
          throw new Error(error.response?.data?.error?.message || 'Gagal menambahkan ke keranjang')
        } finally {
          set({ isSyncing: false })
        }
      },

      updateItem: async (id, quantity) => {
        set({ isSyncing: true })
        try {
          await apiClient.patch(`/buyer/cart/items/${id}`, { quantity })
          await get().fetchCart()
        } catch (error: any) {
          throw new Error(error.response?.data?.error?.message || 'Gagal memperbarui item')
        } finally {
          set({ isSyncing: false })
        }
      },

      removeItem: async (id) => {
        set({ isSyncing: true })
        try {
          await apiClient.delete(`/buyer/cart/items/${id}`)
          await get().fetchCart()
        } catch (error: any) {
          throw new Error(error.response?.data?.error?.message || 'Gagal menghapus item')
        } finally {
          set({ isSyncing: false })
        }
      },

      clearCart: () => set({ items: [], grouped: {}, summary: defaultSummary }),
    }),
    {
      name: 'economic-survival-cart',
      partialize: (state) => ({ items: state.items, summary: state.summary }), // Only persist data, not loading states
    }
  )
)
