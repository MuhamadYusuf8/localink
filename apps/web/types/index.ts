// =====================================================
// Economic Survival — Global TypeScript Type Definitions
// =====================================================

// ─── Enum Types ──────────────────────────────────────────
export type UserRole = 'farmer' | 'buyer' | 'admin'
export type BuyerType = 'retail' | 'wholesale'
export type SubscriptionTier = 'free' | 'basic' | 'pro'
export type ProductStatus = 'draft' | 'active' | 'out_of_stock' | 'archived'
export type PricingType = 'retail' | 'wholesale'
export type MessageType = 'text' | 'image' | 'offer' | 'system'
export type BoostType = 'featured_homepage' | 'top_search' | 'category_banner'

export type OrderStatus =
  | 'pending_payment'
  | 'payment_confirmed'
  | 'processing'
  | 'ready_to_ship'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refund_requested'
  | 'refunded'

// ─── User & Auth ─────────────────────────────────────────
export interface User {
  id: string
  name: string
  email: string
  phone: string | null
  role: UserRole
  avatar_url: string | null
  is_verified: boolean
  email_verified_at: string | null
  phone_verified_at: string | null
  last_login_at: string | null
  created_at: string
  updated_at: string
  // Relationships (optional loaded)
  farmer_profile?: FarmerProfile
  buyer_profile?: BuyerProfile
  farmerProfile?: FarmerProfile // Alias for camelCase
  buyerProfile?: BuyerProfile   // Alias for camelCase
}

export interface AuthResponse {
  user: User
  token: string
  token_type: 'Bearer'
  expires_in: number
}

export interface RegisterFarmerData {
  name: string
  email: string
  phone: string
  password: string
  password_confirmation: string
  store_name: string
  bio?: string
  province: string
  city: string
  district: string
  latitude?: number
  longitude?: number
}

export interface RegisterBuyerData {
  name: string
  email: string
  password: string
  password_confirmation: string
  buyer_type: BuyerType
  company_name?: string
  tax_id?: string
}

// ─── Farmer Profile ───────────────────────────────────────
export interface FarmerProfile {
  id: string
  user_id: string
  store_name: string
  slug: string
  bio: string | null
  banner_url: string | null
  location_label: string | null
  latitude: number | null
  longitude: number | null
  province: string | null
  city: string | null
  district: string | null
  is_premium: boolean
  premium_expires_at: string | null
  total_sales: number
  average_rating: number
  rating_count: number
  subscription_tier: SubscriptionTier
  created_at: string
  updated_at: string
  // Relasi
  user?: User
  distance_km?: number // Dari filter geolokasi
}

// ─── Buyer Profile ────────────────────────────────────────
export interface BuyerProfile {
  id: string
  user_id: string
  buyer_type: BuyerType
  company_name: string | null
  tax_id: string | null
  default_address_id: string | null
  created_at: string
  updated_at: string
}

// ─── Alamat ───────────────────────────────────────────────
export interface Address {
  id: string
  user_id: string
  label: string | null
  recipient_name: string
  phone: string
  full_address: string
  province: string
  city: string
  district: string
  postal_code: string
  latitude: number | null
  longitude: number | null
  is_default: boolean
  created_at: string
  updated_at: string
}

// ─── Kategori Produk ──────────────────────────────────────
export interface ProductCategory {
  id: string
  parent_id: string | null
  name: string
  slug: string
  icon_url: string | null
  sort_order: number
  children?: ProductCategory[]
}

// ─── Gambar Produk ────────────────────────────────────────
export interface ProductImage {
  url: string
  alt: string
  is_primary: boolean
}

// ─── Produk ───────────────────────────────────────────────
export interface Product {
  id: string
  farmer_id: string
  category_id: string | null
  name: string
  slug: string
  description: string | null
  unit: string
  retail_price: number        // Integer IDR (paling kecil)
  wholesale_price: number | null
  wholesale_min_qty: number | null
  stock_qty: number
  images: ProductImage[]
  is_published: boolean
  is_featured: boolean
  featured_until: string | null
  harvest_date: string | null
  available_from: string | null
  tags: string[]
  weight_per_unit: number | null
  status: ProductStatus
  view_count: number
  sold_count: number
  average_rating: number
  rating_count: number
  created_at: string
  updated_at: string
  // Relasi
  farmer?: FarmerProfile
  category?: ProductCategory
}

export interface ProductSummary {
  id: string
  name: string
  slug: string
  farmer_id: string
  farmer_name: string
  farmer_slug: string
  farmer_city: string | null
  category_name: string | null
  primary_image: ProductImage | null
  unit: string
  retail_price: number
  wholesale_price: number | null
  wholesale_min_qty: number | null
  stock_qty: number
  is_featured: boolean
  average_rating: number
  rating_count: number
  harvest_date: string | null
  tags: string[]
  distance_km?: number
}

// ─── Harga Pasar ─────────────────────────────────────────
export interface MarketPrice {
  id: string
  category_id: string
  product_name: string
  region: string
  price_low: number
  price_high: number
  price_avg: number
  source: string | null
  recorded_date: string
  // Kalkulasi tambahan
  trend?: 'up' | 'down' | 'stable'
  trend_percent?: number
}

// ─── Keranjang ────────────────────────────────────────────
export interface CartItem {
  id: string
  user_id: string
  product_id: string
  quantity: number
  pricing_type: PricingType
  product: ProductSummary
  unit_price: number        // Harga yang berlaku
  line_total: number
  created_at: string
  updated_at: string
}

export interface CartGroup {
  farmer: Pick<FarmerProfile, 'id' | 'store_name' | 'slug' | 'banner_url'>
  farmer_user: Pick<User, 'id' | 'name' | 'avatar_url'>
  items: CartItem[]
  subtotal: number
}

export interface CartTotals {
  subtotal: number
  shipping_estimate: number
  commission: number
  grand_total: number
}

// ─── Pesanan ─────────────────────────────────────────────
export interface OrderItemSnapshot {
  name: string
  unit: string
  primary_image: string | null
  farmer_name: string
  farmer_slug: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_snapshot: OrderItemSnapshot
  pricing_type: PricingType
  unit_price: number
  quantity: number
  total_price: number
}

export interface Order {
  id: string
  order_number: string
  buyer_id: string
  farmer_id: string
  shipping_address: Omit<Address, 'id' | 'user_id' | 'is_default' | 'created_at' | 'updated_at'>
  status: OrderStatus
  subtotal: number
  shipping_fee: number
  platform_commission: number
  total_amount: number
  farmer_earnings: number
  payment_method: string | null
  payment_gateway_id: string | null
  payment_proof: string | null
  notes: string | null
  cancelled_reason: string | null
  paid_at: string | null
  shipped_at: string | null
  delivered_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  // Relasi
  items?: OrderItem[]
  buyer?: Pick<User, 'id' | 'name' | 'email' | 'phone' | 'buyerProfile'>
  farmer?: Pick<FarmerProfile, 'id' | 'store_name' | 'slug'>
}

// ─── Percakapan & Pesan ───────────────────────────────────
export interface Conversation {
  id: string
  buyer_id: string
  farmer_id: string
  product_id: string | null
  order_id: string | null
  last_message: string | null
  last_message_at: string | null
  buyer_unread_count: number
  farmer_unread_count: number
  created_at: string
  updated_at: string
  // Relasi
  buyer?: Pick<User, 'id' | 'name' | 'avatar_url'>
  farmer_profile?: Pick<FarmerProfile, 'id' | 'store_name' | 'slug'>
  product?: Pick<Product, 'id' | 'name' | 'slug'>
}

export interface OfferMetadata {
  price: number
  quantity: number
  unit: string
  product_id: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  message_type: MessageType
  metadata: OfferMetadata | null
  is_read: boolean
  read_at: string | null
  created_at: string
}

// ─── Ulasan ───────────────────────────────────────────────
export interface Review {
  id: string
  order_id: string
  order_item_id: string
  reviewer_id: string
  farmer_id: string
  product_id: string | null
  rating: number
  title: string | null
  body: string | null
  images: ProductImage[]
  farmer_reply: string | null
  farmer_replied_at: string | null
  is_verified_purchase: boolean
  is_published: boolean
  created_at: string
  // Relasi
  reviewer?: Pick<User, 'id' | 'name' | 'avatar_url'>
}

// ─── Langganan ────────────────────────────────────────────
export interface Subscription {
  id: string
  farmer_id: string
  plan: 'basic' | 'pro'
  status: 'active' | 'expired' | 'cancelled'
  price_paid: number
  starts_at: string
  expires_at: string
  payment_id: string | null
  created_at: string
  updated_at: string
}

// ─── API Response Format ──────────────────────────────────
export interface ApiSuccessResponse<T> {
  success: true
  data: T
  meta?: {
    pagination?: PaginationMeta
    [key: string]: unknown
  }
}

export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, string[]>
  }
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

export interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    pagination: PaginationMeta
  }
}

// ─── Filter Produk ────────────────────────────────────────
export interface ProductFilters {
  q?: string
  category?: string
  province?: string
  city?: string
  min_price?: number
  max_price?: number
  pricing_type?: PricingType
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'rating'
  featured_only?: boolean
  page?: number
  per_page?: number
  lat?: number
  lng?: number
  radius_km?: number
}

// ─── Filter Petani ────────────────────────────────────────
export interface FarmerFilters {
  q?: string
  province?: string
  city?: string
  category?: string
  sort?: 'rating' | 'sales' | 'newest'
  lat?: number
  lng?: number
  radius_km?: number
  page?: number
  per_page?: number
}

// ─── Checkout ─────────────────────────────────────────────
export interface CheckoutData {
  address_id: string
  notes?: Record<string, string>  // farmer_id → catatan
  payment_method?: string
}

export interface CheckoutResponse {
  orders: Order[]
  snap_token: string
  redirect_url: string
}

// ─── Statistik Dashboard ──────────────────────────────────
export interface DashboardStats {
  revenue_this_month: number
  revenue_last_month: number
  orders_this_month: number
  orders_last_month: number
  repeat_buyer_rate: number
  average_order_value: number
  total_products: number
  average_rating: number
}

export interface RevenueChartPoint {
  date: string
  revenue: number
  orders: number
}

export interface TopProduct {
  product: ProductSummary
  sold_count: number
  revenue: number
}

// ─── Geolokasi ────────────────────────────────────────────
export interface GeolocationState {
  lat: number | null
  lng: number | null
  permission: 'prompt' | 'granted' | 'denied'
  isLoading: boolean
}

// ─── Notifikasi ───────────────────────────────────────────
export type NotificationType =
  | 'new_message'
  | 'order_status_change'
  | 'offer_received'
  | 'review_posted'
  | 'payment_confirmed'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  body: string
  is_read: boolean
  data: Record<string, unknown>
  created_at: string
}
